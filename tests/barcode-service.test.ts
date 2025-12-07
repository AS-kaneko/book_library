import { BarcodeService } from '../src/services/BarcodeService';

async function testBarcodeService() {
  console.log('=== BarcodeService Test ===\n');
  
  const service = new BarcodeService('data/barcodes');
  
  // Test 1: ISBN Validation
  console.log('Test 1: ISBN Validation');
  console.log('------------------------');
  
  // Valid ISBN-13 examples (実際に有効なISBN)
  const validISBN13 = [
    '978-0-306-40615-7',  // 有効なISBN-13
    '9780306406157',      // ハイフンなし
    '978-1-86197-876-9'   // 別の有効なISBN-13
  ];
  
  console.log('Valid ISBN-13 tests:');
  validISBN13.forEach(isbn => {
    console.log(`  ${isbn}: ${service.validateISBN(isbn) ? '✓ PASS' : '✗ FAIL'}`);
  });
  
  // Valid ISBN-10 examples
  const validISBN10 = [
    '0-306-40615-2',
    '0306406152'
  ];
  
  console.log('\nValid ISBN-10 tests:');
  validISBN10.forEach(isbn => {
    console.log(`  ${isbn}: ${service.validateISBN(isbn) ? '✓ PASS' : '✗ FAIL'}`);
  });
  
  // Invalid ISBN examples
  const invalidISBN = [
    '123-456-789',
    '978-0-000-00000-0',
    'not-an-isbn',
    '12345'
  ];
  
  console.log('\nInvalid ISBN tests (should all be false):');
  invalidISBN.forEach(isbn => {
    console.log(`  ${isbn}: ${!service.validateISBN(isbn) ? '✓ PASS' : '✗ FAIL'}`);
  });
  
  // Test 2: Barcode Generation
  console.log('\n\nTest 2: Barcode Generation');
  console.log('---------------------------');
  
  try {
    const employeeId = 'EMP001';
    console.log(`Generating barcode for ${employeeId}...`);
    const filepath = await service.generateEmployeeBarcode(employeeId);
    console.log(`✓ Barcode generated successfully: ${filepath}`);
    console.log(`✓ Barcode exists: ${service.barcodeExists(employeeId)}`);
    
    // Clean up
    service.deleteBarcode(employeeId);
    console.log(`✓ Barcode deleted successfully`);
    console.log(`✓ Barcode no longer exists: ${!service.barcodeExists(employeeId)}`);
  } catch (error) {
    console.error('✗ Barcode generation failed:', error);
  }
  
  console.log('\n=== All Tests Complete ===');
}

testBarcodeService().catch(console.error);
