import PyPDF2
import semchunk
import tiktoken
import hashlib

def doc_chunking(uploaded_file, chunk_size=1500, overlap=200):
    try:
        pdf_reader = PyPDF2.PdfReader(uploaded_file, strict=False)
    except Exception as e:
        raise ValueError(
            f"Could not read the resume PDF. The file appears to be corrupted or is not a valid PDF. "
            f"Please ask the student to re-upload their resume. (Detail: {e})"
        )
    alltext = []
    page_numbers = []
    
    # Extract text page by page and keep track of page numbers
    for i, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        if text:
            alltext.append(text)
            page_numbers.append(i+1)  # Page numbers start from 1
    
    full_text = '\n'.join(alltext)
    
    chunker = semchunk.chunkerify(tiktoken.encoding_for_model('gpt-4o-mini'), chunk_size)
    chunks = chunker(full_text, overlap=overlap)
    
    # Assign page numbers to chunks
    chunk_page_numbers = []
    current_pos = 0
    
    for chunk in chunks:
        chunk_start = full_text.find(chunk, current_pos)
        current_pos = chunk_start
        
        # Find which page this chunk belongs to by comparing positions
        cumulative_length = 0
        for idx, text in enumerate(alltext):
            cumulative_length += len(text) + 1  # +1 for the newline
            if chunk_start < cumulative_length:
                chunk_page_numbers.append(page_numbers[idx])
                break
    
    return list(zip(chunks, chunk_page_numbers))

def hash_doc(filepath):
    """
    Compute the SHA256 hash of a PDF document.
    
    Args:
        filepath (str): Path to the PDF file.
    
    Returns:
        str: Hexadecimal SHA256 hash of the PDF.
    """
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read and update hash in chunks to handle large files
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

if __name__ == "__main__":
    uploaded_file = r"D:\Research\Skill_Gap\B.E curriculum pdf\curriculum_comp_sci_eng_VIT.pdf"

    hash = hash_doc(uploaded_file)
    # # chunks = curriculum_modules_extract(uploaded_file,page_start=13,page_end=224)
    # chunks = curriculum_chunking(uploaded_file)
    # output = chunks