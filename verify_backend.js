import axios from 'axios';

const GATEWAY_URL = 'http://localhost:3000/api';

async function test() {
    try {
        console.log('1. Authentication...');
        let token;
        let userId;

        // Try Login
        try {
            const randomId = Math.random().toString(36).substring(7);
            const loginRes = await axios.post(`${GATEWAY_URL}/auth/login`, {
                identifier: `test${randomId}@example.com`,
                password: 'password123'
            });
            token = loginRes.data.accessToken;
            userId = loginRes.data.user.id;
            console.log('   Login successful.');
        } catch (e) {
            console.log('   Login failed or user not found, attempting registration...');
            try {
                const randomId = Math.random().toString(36).substring(7);
                const regRes = await axios.post(`${GATEWAY_URL}/auth/register`, {
                    username: `testuser${randomId}`,
                    email: `test${randomId}@example.com`,
                    password: 'password123',
                    role: 'student'
                });
                token = regRes.data.accessToken;
                userId = regRes.data.user.id;
                console.log('   Registration successful.');
            } catch (regErr) {
                throw new Error(`Registration failed: ${regErr.message} - ${JSON.stringify(regErr.response?.data)}`);
            }
        }

        if (!token) throw new Error('Failed to obtain token');

        console.log('2. Creating React Workspace...');
        const createRes = await axios.post(`${GATEWAY_URL}/workspaces`, {
            language: 'typescript',
            templateId: 'nextjs'
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        const workspace = createRes.data.workspace;
        const workspaceId = workspace.workspaceId;
        console.log(`   Workspace created (ID: ${workspaceId}, Container: ${workspace.containerId})`);

        // Wait a moment for container/files
        await new Promise(r => setTimeout(r, 2000));

        console.log('3. Verifying Files via Gateway...');
        const filesRes = await axios.get(`${GATEWAY_URL}/workspaces/${workspaceId}/files?path=.`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const items = filesRes.data.files || [];
        console.log('   Files found:', items.length);

        console.log('4. Verifying Container Status...');
        const statusRes = await axios.post(`${GATEWAY_URL}/workspaces/${workspaceId}/ensure-running`, {}, {
             headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Container Status:', statusRes.data.status);

        console.log('5. Deleting Workspace...');
        const deleteRes = await axios.delete(`${GATEWAY_URL}/workspaces/${workspaceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (deleteRes.data.success) {
            console.log('   SUCCESS: Workspace deleted successfully.');
        } else {
            console.error('   FAILURE: Delete returned success=false', deleteRes.data);
        }
        
        // Verify deletion by trying to fetch it
        try {
            await axios.get(`${GATEWAY_URL}/workspaces/${workspaceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('   FAILURE: Workspace still exists after deletion!');
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log('   SUCCESS: Workspace not found (404) as expected.');
            } else {
                console.error('   WARNING: Unexpected error fetching deleted workspace:', err.message);
            }
        }

    } catch (err) {
        console.error('TEST FAILED:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
            console.error('Response Status:', err.response.status);
        } else {
            console.error('Stack:', err.stack);
        }
        process.exit(1);
    }
}

test();
