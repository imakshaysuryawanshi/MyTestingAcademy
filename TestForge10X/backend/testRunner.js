import { promptLoader } from './src/utils/promptLoader.js';

async function runTest() {
  await promptLoader.initialize();
  console.log('--- RAW TEST DUMP ---');
  console.log(promptLoader.listPrompts());
  console.log('--- TEST COMPILE (codeGen) ---');
  console.log(promptLoader.getPrompt('codegen/selenium-java', { TEST_CASE: 'Validate User Login Redirect' }).substring(0, 100) + '...');
}
runTest();
