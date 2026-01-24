import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test@123456'
};

let authToken = '';
let workspaceId = '';

async function testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        return false;
    }
}

async function testRegistration() {
    console.log('\n🔍 Testing User Registration...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
        console.log('✅ Registration Successful:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Registration Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testLogin() {
    console.log('\n🔍 Testing User Login...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        authToken = response.data.accessToken || '';
        if (authToken) {
            console.log('✅ Login Successful. Token received:', authToken.substring(0, 20) + '...');
            return true;
        } else {
            console.error('❌ Login Failed: No token in response');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Login Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCreateWorkspace() {
    console.log('\n🔍 Testing Workspace Creation...');
    try {
        const response = await axios.post(
            `${BASE_URL}/api/workspaces`,
            {
                name: `Test Workspace ${Date.now()}`,
                template: 'react',
                description: 'Test workspace for React'
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        // Handle different response structures
        const workspace = response.data.workspace || response.data;
        
        // IMPORTANT: The backend uses 'workspaceId' (UUID) for API lookups, NOT the Mongo '_id'
        // We must prioritize grabbing 'workspaceId'
        workspaceId = workspace.workspaceId || workspace.id || workspace._id;
        
        console.log('✅ Workspace Created:', {
            mongoId: workspace._id,
            workspaceId: workspaceId,
            name: workspace.name,
            template: workspace.templateId || workspace.template,
            containerId: workspace.containerId
        });
        
        if (!workspaceId) {
            console.error('❌ Could not determine workspace ID from response');
            console.dir(workspace, { depth: null });
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Workspace Creation Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetWorkspaces() {
    console.log('\n🔍 Testing Get Workspaces...');
    try {
        const response = await axios.get(`${BASE_URL}/api/workspaces`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Workspaces Retrieved:', response.data.workspaces.length, 'workspace(s)');
        if (response.data.workspaces.length > 0) {
            const ws = response.data.workspaces[0];
            console.log('First workspace:', {
                mongoId: ws._id,
                workspaceId: ws.workspaceId, 
                name: ws.templateName,
                template: ws.templateId
            });
        }
        return true;
    } catch (error) {
        console.error('❌ Get Workspaces Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetWorkspaceFiles() {
    console.log('\n🔍 Testing Get Workspace Files...');
    console.log('Using workspace ID:', workspaceId);
    try {
        const response = await axios.get(
            `${BASE_URL}/api/workspaces/${workspaceId}/files`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        console.log('✅ Workspace Files Retrieved:', response.data.files?.length || 0, 'file(s)');
        return true;
    } catch (error) {
        console.error('❌ Get Workspace Files Failed:', error.response?.data || error.message);
        console.error('Full error:', error.response?.status, error.response?.statusText);
        return false;
    }
}

async function testCreateFile() {
    console.log('\n🔍 Testing Create File...');
    try {
        // Gateway maps POST /file to Service PUT /file
        const response = await axios.post(
            `${BASE_URL}/api/workspaces/${workspaceId}/file`,
            {
                path: 'test_feature.txt',
                content: 'Hello World from Antigravity Feature Test!'
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        console.log('✅ File Created:', response.data.message || 'Success');
        return true;
    } catch (error) {
        console.error('❌ Create File Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testReadFile() {
    console.log('\n🔍 Testing Read File...');
    try {
        // Gateway maps GET /file?path=... to Service POST /file
        const response = await axios.get(
            `${BASE_URL}/api/workspaces/${workspaceId}/file`,
            {
                params: { path: 'test_feature.txt' },
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        console.log('✅ File Content Retrieved:', response.data.content);
        if (response.data.content === 'Hello World from Antigravity Feature Test!') {
            return true;
        } else {
            console.error('❌ Content mismatch');
            return false;
        }
    } catch (error) {
        console.error('❌ Read File Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeleteWorkspace() {
    console.log('\n🔍 Testing Workspace Deletion...');
    try {
        const response = await axios.delete(
            `${BASE_URL}/api/workspaces/${workspaceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        console.log('✅ Workspace Deleted Successfully');
        return true;
    } catch (error) {
        console.error('❌ Workspace Deletion Failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Backend API Tests...\n');
    console.log('=' .repeat(60));
    
    const results = {
        healthCheck: await testHealthCheck(),
        registration: await testRegistration(),
        login: await testLogin(),
        createWorkspace: false,
        getWorkspaces: false,
        getWorkspaceFiles: false,
        createFile: false,
        readFile: false,
        deleteWorkspace: false
    };

    // Only run authenticated tests if login succeeded
    if (results.login) {
        results.createWorkspace = await testCreateWorkspace();
        results.getWorkspaces = await testGetWorkspaces();
        
        if (results.createWorkspace) {
            results.getWorkspaceFiles = await testGetWorkspaceFiles();
            results.createFile = await testCreateFile();
            if (results.createFile) {
                results.readFile = await testReadFile();
            }
            results.deleteWorkspace = await testDeleteWorkspace();
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(60));
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const icon = result ? '✅' : '❌';
        console.log(`${icon} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('=' .repeat(60));
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total * 100)}%)`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Backend is fully functional.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the logs above.');
    }
}

// Run all tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal Error:', error);
    process.exit(1);
});
