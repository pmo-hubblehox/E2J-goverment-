from typing import List
from haystack import component
from haystack.dataclasses import Document
from haystack.dataclasses import ChatMessage
import tiktoken
from copy import deepcopy

@component
class ChatMessagesPruner:
    """
    A component for pruning chat messages to fit within a specified context length for use with ChatGenerators.

    This class ensures that the total token count of messages does not exceed the maximum context length allowed by the model.
    It prioritizes retaining system messages if `persistent_sys` is set to `True` and prunes older user/assistant messages as needed.

    Parameters:
        model (str): The name of the language model in use (default: 'gpt-4o-mini').
        persistent_sys (bool): Whether to preserve system messages during pruning (default: False).
        context_length (int): Maximum context length in tokens (default: 4000).

    Returns:
        pruned_messages (List[ChatMessage]): A list of chat messages that fit within the specified context length.

    Example:
        >>> pruner = ChatMessagesPruner(model='gpt-4o-mini', persistent_sys=True, context_length=4000)
        >>> messages = [
                ChatMessage(_role='system', text='You are a helpful assistant.'),
                ChatMessage(_role='user', text='What is the capital of France?'),
                ChatMessage(_role='assistant', text='The capital of France is Paris.')
            ]
        >>> result = pruner.run(messages)
        >>> print(result['documents'])
    """
    def __init__(self,model='gpt-4o-mini',persistent_sys=False,context_length = 4000):
        try:
            self.encoder = tiktoken.encoding_for_model(model)
        except:
            self.encoder = tiktoken.encoding_for_model('gpt-4o-mini')
        self.persistent_sys = persistent_sys
        self.context_length = context_length
        self.message_stack = []
        self.no_of_tokens = 0

    def _count_and_insert(self,messages):
        stack = []
        messages.reverse()
        for message in messages:
            self.no_of_tokens+=len(self.encoder.encode(message.text))
            if self.no_of_tokens>=self.context_length:
                break
            else:
                stack.append(message)
        stack.reverse()
        self.message_stack.extend(stack)

    @component.output_types(messages=List[ChatMessage])
    def run(self,messages:List[ChatMessage]):
        """
        Prune chat messages to fit within the specified context length.

        This method processes a list of chat messages, prioritizing system messages if `persistent_sys` is set to `True`. 
        It ensures that the total token count of all retained messages does not exceed `context_length`. 
        Messages are added to a stack in reverse order (most recent first) until the token limit is reached.

        Parameters:
            messages (List[ChatMessage]): A list of chat messages to be pruned. Each message must have a `_role` attribute 
                                        ('system', 'user', or 'assistant') and a `text` attribute containing the message content.

        Returns:
            dict: A dictionary with the following key:
                - 'documents' (List[ChatMessage]): A list of pruned chat messages that fit within the specified context length.
        
        Raises:
            ValueError: If any message does not have a `_role` or `text` attribute.
        
        Example:
            >>> pruner = ChatMessagesPruner(model='gpt-4o-mini', persistent_sys=True, context_length=4000)
            >>> messages = [
                    ChatMessage(_role='system', text='You are a helpful assistant.'),
                    ChatMessage(_role='user', text='What is the capital of France?'),
                    ChatMessage(_role='assistant', text='The capital of France is Paris.')
                ]
            >>> result = pruner.run(messages)
            >>> print(result['documents'])
        """
        messages = [msg for msg in messages if msg.text!=None]
        if self.persistent_sys:
            sys_messages = []
            chat_messages = []

            for message in messages:
                if message._role == 'system':
                    sys_messages.append(message)
                else:
                    chat_messages.append(message)

            self._count_and_insert(sys_messages)
            self._count_and_insert(chat_messages)
        else:
            self._count_and_insert(messages)
        
        message_stack = deepcopy(self.message_stack)
        self.message_stack=[]
        self.no_of_tokens = 0

        return {'messages':message_stack}