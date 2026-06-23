import fetch from 'node-fetch';

async function test() {
  const payload = {
    "sessionId": "test-123",
    "attentionType": "dividida",
    "game": "escuta-seletiva",
    "severity": "minimo",
    "totalRounds": 10,
    "serialAccuracy": 0.9,
    "itemAccuracy": 0.95,
    "omissions": 0,
    "meanResponseTimeMs": 1200,
    "distractorIntrusionRate": 0.05,
    "loadCost": 0.1,
    "avgReplayCount": 1.2,
    "accuracyNote": "Boa",
    "intrusionNote": "Boa"
  };

  const res = await fetch('http://localhost:8080/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log(res.status);
  const text = await res.text();
  console.log(text);
}

test();
