import chromadb

client = chromadb.PersistentClient(path=r"W:\RAG\chromadb")

collection = client.get_collection("naive_rag_01")

print("\n=== COLLECTION INFO ===")
print("Total Chunks:", collection.count())

results = collection.get()

print("\n=== FIRST 5 CHUNKS ===\n")

documents = results["documents"]

for i, doc in enumerate(documents[:5]):
    print(f"\n--- Chunk {i+1} ---")
    print(doc)