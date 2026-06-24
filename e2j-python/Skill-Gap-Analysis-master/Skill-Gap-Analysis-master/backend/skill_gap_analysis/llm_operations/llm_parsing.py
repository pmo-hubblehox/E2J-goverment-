import re
import ast

def extract_final_answer(response: str, parse: bool = True):
    """
    Extracts content from `````` code block.
    
    Args:
        response: LLM response string
        parse: If True, parse as Python literal. If False, return raw string.
    
    Returns:
        Parsed Python object (dict/list/etc) if parse=True, raw string if parse=False, or None if not found.
    """
    pattern = r"```(?:final_answer)?\s*(.*?)```"
    match = re.search(pattern, response, re.DOTALL)
    if not match:
        return None
    
    content = match.group(1).strip()
    
    if not parse:
        return content
    
    # Try to parse as Python literal
    try:
        return ast.literal_eval(content)
    except (ValueError, SyntaxError):
        # If parsing fails, return None or optionally fall back to raw string
        return None
