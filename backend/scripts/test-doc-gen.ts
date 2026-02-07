
import axios from 'axios';

async function verifyDocGen() {
    const EMAIL = `doc_test_${Date.now()}@test.com`;
    const PASSWORD = 'password123';

    try {
        console.log('Registering...');
        const regRes = await axios.post('http://localhost:3000/api/auth/register', {
            email: EMAIL,
            password: PASSWORD
        });
        const token = regRes.data.token;
        console.log('Registered & Got token');

        console.log('Creating Design...');
        const designRes = await axios.post('http://localhost:3000/api/design', {
            prompt: 'Design a simple URL shortener'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const projectId = designRes.data.projectId;
        console.log(`Created Project: ${projectId}`);

        // Wait a bit for at least one agent (Requirement Analyzer) to maybe finish?
        // Actually doc generator should handle partial data.
        console.log('Fetching Doc immediately (expecting partial)...');

        const docRes = await axios.get(`http://localhost:3000/api/design/${projectId}/doc`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (docRes.data.success) {
            console.log('SUCCESS: Documentation generated.');
            console.log('Title:', docRes.data.title);
            console.log('Snippet length:', docRes.data.markdown.length);
            console.log('Snippet:', docRes.data.markdown.substring(0, 100));
        } else {
            console.error('FAILED:', docRes.data);
        }

    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
}

verifyDocGen();
