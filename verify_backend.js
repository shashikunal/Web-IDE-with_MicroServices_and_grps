import axios from 'axios';

async function test() {
    try {
        console.log('1. Authentication...');
        let token;
        try {
            const randomId = Math.random().toString(36).substring(7);
            const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
                identifier: `test${randomId}@example.com`,
                password: 'password123'
            });
            token = loginRes.data.accessToken;
            console.log('   Login successful.');
        } catch (e) {
            console.log('   Login failed, attempting registration...');
            try {
                const randomId = Math.random().toString(36).substring(7);
                const regRes = await axios.post('http://localhost:3001/api/auth/register', {
                    username: `testuser${randomId}`,
                    email: `test${randomId}@example.com`,
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'User'
                });
                token = regRes.data.accessToken;
                console.log('   Registration successful.');
            } catch (regErr) {
                throw new Error(`Registration failed: ${regErr.response?.data?.message || regErr.message}`);
            }
        }

        console.log('2. Creating React Container...');
        const createRes = await axios.post('http://localhost:3001/api/container/create', {
            language: 'typescript',
            templateId: 'react-app',
            templateName: 'React'
        }, { headers: { Authorization: `Bearer ${token}` } });
        const { userId } = createRes.data;
        console.log(`   Container created (User: ${userId})`);

        console.log('3. Populating Template...');
        await axios.post(`http://localhost:3001/api/templates/react-app/create`, {
            userId
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('   Template populated.');

        // Wait a moment for file operations
        await new Promise(r => setTimeout(r, 2000));

        console.log('4. Verifying Files...');
        const filesRes = await axios.get(`http://localhost:3001/api/container/files?userId=${userId}&path=/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const items = filesRes.data.items || [];
        const hasPackageJson = items.some(f => f.name === 'package.json');
        const hasSrc = items.some(f => f.name === 'src' || f.name === 'src/');

        if (hasPackageJson && hasSrc) {
            console.log('   SUCCESS: Essential files found!');
            console.log('   Files found:', items.map(i => i.name).join(', '));
        } else {
            console.error('   FAILURE: Files missing.', items);
            process.exit(1);
        }

    } catch (err) {
        console.error('TEST FAILED:', err.response ? JSON.stringify(err.response.data) : err.stack);
        process.exit(1);
    }
}

test();
