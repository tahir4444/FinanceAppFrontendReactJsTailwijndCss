#!/usr/bin/env node

// Test script to debug agent login issue
console.log('🧪 Agent Login Debug Test');
console.log('==========================');

// Simulate the role checking logic
function testRoleChecking() {
  console.log('\n📋 Testing Role Checking Logic:');
  
  // Test case 1: User with role property
  const user1 = { role: 'agent' };
  const userRole1 = user1?.role || user1?.Role?.name;
  console.log('User 1 (role property):', userRole1);
  
  // Test case 2: User with Role.name property
  const user2 = { Role: { name: 'agent' } };
  const userRole2 = user2?.role || user2?.Role?.name;
  console.log('User 2 (Role.name property):', userRole2);
  
  // Test case 3: User with both properties
  const user3 = { role: 'admin', Role: { name: 'agent' } };
  const userRole3 = user3?.role || user3?.Role?.name;
  console.log('User 3 (both properties):', userRole3);
  
  // Test case 4: User with no role
  const user4 = {};
  const userRole4 = user4?.role || user4?.Role?.name;
  console.log('User 4 (no role):', userRole4);
  
  // Test case 5: User with null role
  const user5 = { role: null, Role: null };
  const userRole5 = user5?.role || user5?.Role?.name;
  console.log('User 5 (null role):', userRole5);
}

// Test the role checking logic
testRoleChecking();

console.log('\n🔍 Expected Backend Response Structure:');
console.log('The backend should return user data like this:');
console.log('{');
console.log('  id: 123,');
console.log('  name: "Agent Name",');
console.log('  email: "agent@example.com",');
console.log('  Role: {');
console.log('    name: "agent",');
console.log('    description: "Agent role"');
console.log('  }');
console.log('}');

console.log('\n🚀 To test agent login:');
console.log('1. Open browser console');
console.log('2. Login with agent credentials');
console.log('3. Check console logs for role detection');
console.log('4. Look for "Login: User role detected:" message');
console.log('5. Check if redirect happens to /agent-dashboard');





