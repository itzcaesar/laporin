// Simple AI chatbot test
const baseUrl = 'http://localhost:4000/api/v1';

async function testChatbot() {
  console.log('🤖 Testing AI Chatbot...\n');

  try {
    const response = await fetch(`${baseUrl}/ai/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Bagaimana cara melaporkan jalan rusak?',
        history: [],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Chatbot Response:');
      console.log('---');
      console.log(data.data.message);
      console.log('---\n');
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testChatbotWithHistory() {
  console.log('🤖 Testing AI Chatbot with History...\n');

  try {
    const response = await fetch(`${baseUrl}/ai/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Berapa lama prosesnya?',
        history: [
          {
            role: 'user',
            content: 'Bagaimana cara melaporkan jalan rusak?',
          },
          {
            role: 'assistant',
            content:
              'Anda bisa melaporkan jalan rusak melalui aplikasi Laporin dengan mengisi formulir laporan dan mengunggah foto kerusakan.',
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Chatbot Response (with history):');
      console.log('---');
      console.log(data.data.message);
      console.log('---\n');
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testSummarize() {
  console.log('📝 Testing AI Summarization...\n');

  const longDescription = `Jalan di depan rumah saya di Jalan Merdeka No. 123 mengalami kerusakan yang cukup parah. 
  Terdapat lubang besar dengan diameter sekitar 2 meter dan kedalaman 30 cm. 
  Lubang ini sangat berbahaya terutama saat malam hari karena tidak ada penerangan yang memadai. 
  Sudah ada beberapa pengendara motor yang terjatuh akibat lubang ini. 
  Mohon segera diperbaiki karena ini adalah jalan utama yang dilalui banyak kendaraan setiap hari.`;

  // We'll test this through the AI service directly
  console.log('Original description length:', longDescription.length, 'characters');
  console.log('(Summarization would be tested through report creation)\n');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 LAPORIN AI SERVICE TESTS');
  console.log('='.repeat(60));
  console.log();

  await testChatbot();
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between requests

  await testChatbotWithHistory();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  testSummarize();

  console.log('='.repeat(60));
  console.log('✅ Tests completed!');
  console.log('='.repeat(60));
}

runTests();
