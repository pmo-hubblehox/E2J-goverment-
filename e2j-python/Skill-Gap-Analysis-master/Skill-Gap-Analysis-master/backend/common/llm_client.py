#General components
import asyncio
from haystack import Pipeline,AsyncPipeline
from haystack.components.builders import ChatPromptBuilder
from haystack.utils import Secret

#Chat Store components
from haystack_experimental.chat_message_stores.in_memory import InMemoryChatMessageStore
from haystack_experimental.components.retrievers import ChatMessageRetriever
from haystack_experimental.components.writers import ChatMessageWriter

from dotenv import load_dotenv

load_dotenv()

#OpenAI Generator component
from haystack.components.generators.chat import OpenAIChatGenerator
from backend.common.integrations.custom_haystack_modules.chat_pruning import ChatMessagesPruner
from pathlib import Path
import csv

class ProgrammableLLM():
    def __init__(self):
        #Initialize pipeline as empty
        self.model = 'gpt-4o-mini'
        self._build_pipelines()
        self.system_prompts = []
        self.async_inputs = []
        self.auxiliary_prompts = []
        self.debug = False

    def set_system_prompts(self, sys_prompts):
        if isinstance(sys_prompts,str):
            sys_prompts = [sys_prompts]

        self.system_prompts = sys_prompts

    def add_auxiliary_prompts(self,aux_prompts):
        self.auxiliary_prompts = aux_prompts

    def build_from_prompt_stack(self,stack):
        self.prompt_builder = ChatPromptBuilder(template = stack)

    def _build_pipelines(self):
        self.inference_pipeline = AsyncPipeline()

        llm_generator = OpenAIChatGenerator(
            api_key=Secret.from_env_var("OPENAI_API_KEY"),
            model=self.model,
            generation_kwargs={"temperature": 0, "top_p": 0.001, "seed":42}
        )

        pruner = ChatMessagesPruner(model=self.model, persistent_sys=False, context_length=16000)
        prompt_builder = ChatPromptBuilder()

        self.inference_pipeline.add_component('pruner', pruner)
        self.inference_pipeline.add_component('prompt_builder', prompt_builder)
        self.inference_pipeline.add_component('llm_generator', llm_generator)

        self.inference_pipeline.connect('pruner.messages', 'prompt_builder.template')
        self.inference_pipeline.connect('prompt_builder.prompt', 'llm_generator.messages')
        
    def add(self,prompt_stack,datas):
        self.async_inputs.append((prompt_stack,datas))

    def _save_metadata_to_csv(self, results) -> None:
        """
        Saves LLM result metadata to a CSV file.
        
        Appends data if file exists, creates new file with headers if not.
        
        Args:
            filepath: Path to the CSV file
            metadata_list: List of dictionaries containing metadata
                          (e.g., completion_tokens, prompt_tokens, total_tokens, model)
        
        Example:
            >>> llm = ProgrammableLLM()
            >>> llm.save_metadata_to_csv(results)
        """
        if not results:
            print("No metadata to save")
            return
        
        def get_info(result):
            row = {}
            row['completion_tokens'] = result['llm_generator']['replies'][0].meta['usage']['completion_tokens']
            row['prompt_tokens'] = result['llm_generator']['replies'][0].meta['usage']['prompt_tokens']
            row['total_tokens'] = result['llm_generator']['replies'][0].meta['usage']['total_tokens']
            row['model'] = result['llm_generator']['replies'][0].meta['model']
            return row
        
        metadata_list = [get_info(result) for result in results]

        filepath = Path("./model_usage.csv")
        file_exists = filepath.exists()
        
        try:
            # Extract fieldnames from first dictionary
            fieldnames = list(metadata_list[0].keys())
            
            with open(filepath, mode='a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                # Write header only if file is new
                if not file_exists:
                    writer.writeheader()
                
                # Write all metadata rows
                writer.writerows(metadata_list)
            
            print(f"Successfully saved {len(metadata_list)} records to {filepath}")
            
        except (IOError, PermissionError) as e:
            print(f"Error writing to file: {e}")
        except KeyError as e:
            print(f"Inconsistent dictionary keys in metadata: {e}")

    async def async_run(self,include_outputs=['llm_generator']):
        results = await self._concurrent_execution(self.async_inputs,include_outputs)
        if self.debug:
            self._save_metadata_to_csv(results)
        return results
    
    async def  _concurrent_execution(self, inputs, include_outputs=['llm_generator'], max_concurrent=8):
        """
        Run multiple LLM queries in parallel asynchronously.

        Args:
            inputs: List of tuples (prompt_stack, datas)
            include_outputs: Which pipeline outputs to include
            max_concurrent: Maximum number of concurrent tasks

        Returns:
            List of pipeline results, one per input
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def limited_run(prompt_stack, datas):
            async with semaphore:
                return await self.inference_pipeline.run_async(
                    data={
                        "pruner": {
                            "messages": self.system_prompts + prompt_stack + self.auxiliary_prompts
                        },
                        "prompt_builder": {
                            "template_variables": datas
                        }
                    },
                    include_outputs_from=set(self.inference_pipeline.graph.nodes).intersection(include_outputs)
                )

        tasks = [
            limited_run(prompt_stack, datas)
            for prompt_stack, datas in inputs
        ]
        results = await asyncio.gather(*tasks)
        self.async_inputs = []
        return results