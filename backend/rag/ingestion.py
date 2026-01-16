import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

"""embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001"
)"""

embeddings = HuggingFaceEndpointEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2"  
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> backend/
DATA_DIR = os.path.join(BASE_DIR, "data")

DOMAINS = {
    "medical_faqs": os.path.join(DATA_DIR, "medical_faqs"),
    "drug_dosages": os.path.join(DATA_DIR, "drug_dosages"),
    "drug_interactions": os.path.join(DATA_DIR, "drug_interactions"),
}

def load_and_split_pdfs(folder_path: str, domain: str):
    from langchain_core.documents import Document

    documents = []

    for file in os.listdir(folder_path):
        if file.endswith(".pdf"):
            file_path = os.path.join(folder_path, file)
            print(f" Loading: {file_path}")
            loader = PyPDFLoader(file_path)
            pdf_docs = loader.load()
            for doc in pdf_docs:
                doc.metadata["domain"] = domain
            documents.extend(pdf_docs)


    if not documents:
        print(f" No documents found for {domain}")
        return []
    

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    return chunks



def get_or_create_vectorstore(domain:str, folder_path: str):
    """Loads FAISS store if exists, else builds and saves a new one"""
    store_path = f"./backend/rag/{domain}_store"

    # if FAISS store exists, load it
    if os.path.exists(store_path):
        print (f" Found existing FAISS store for {domain}, loading...")
        vectorstore = FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)
    else:
        print(f" Creating FAISS store for {domain} ...")
        docs = load_and_split_pdfs(folder_path, domain)
        if not docs:
            print(f" Skipping {domain} — no documents loaded.")
            return None
        vectorstore = FAISS.from_documents(docs, embeddings)
        vectorstore.save_local(store_path)
        print(f" Saved FAISS store at {store_path}")

    return vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})


"""def get_vectorstore(domain: str):
   # Load existing FAISS store, skip creation if missing.
    store_path = f"./backend/rag/{domain}_store"

    if os.path.exists(store_path):
        print(f"Found existing FAISS store for {domain}, loading...")
        vectorstore = FAISS.load_local(
            store_path, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        return vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    else:
        print(f"⚠️ FAISS store for {domain} not found, skipping...")
        return None


def initialize_vectorstores():
    # Load all existing vector stores without creating new ones.
    retrievers = {}
    for domain in DOMAINS.keys():
        retriever = get_vectorstore(domain)
        if retriever:
            retrievers[domain] = retriever

    print("\nVectorstores loaded for all available domains.")
    return retrievers
"""



def initialize_vectorstores():
    """Main entry -builds or loads all vector stores and returns retrievers."""
    retrievers = {}
    for domain, folder in DOMAINS.items():
        retriever = get_or_create_vectorstore(domain, folder)
        if retriever:
            retrievers[domain] = retriever
    print("\n Vectorstores initialized for all available domains.")
    return retrievers

if __name__ == "__main__":
    initialize_vectorstores()
