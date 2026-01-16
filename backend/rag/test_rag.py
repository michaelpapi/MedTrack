# test_rag.py
import asyncio
import websockets
import json

async def test_rag():
    uri = "ws://localhost:8000/rag/ws/ask"
    async with websockets.connect(uri) as websocket:
        query = {"query": "What do I do in a case of anaphylaxis?"}
        await websocket.send(json.dumps(query))
        print("🟢 Sent query")

        while True:
            try:
                msg = await websocket.recv()
                data = json.loads(msg)
                print("📨", data)

                if data.get("type") == "final":
                    print("\n✅ FINAL ANSWER:")
                    print(data["answer"])
                    print("\n🔗 Sources:", data.get("sources", []))
                    break
            except websockets.ConnectionClosed:
                print("❌ Connection closed")
                break

if __name__ == "__main__":
    asyncio.run(test_rag())
