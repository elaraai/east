import { VectorType, MatrixType, IntegerType, FloatType, BooleanType, matrix } from "../src/index.js";
import { encodeBeast2For, decodeBeast2For } from "../src/internal.js";

let failures = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (e: any) {
    failures++;
    console.log(`  ✗ ${label}: ${e.message}`);
  }
}

function roundTrip(label: string, type: any, value: any) {
  const encode = encodeBeast2For(type);
  const decode = decodeBeast2For(type);
  const encoded = encode(value);

  // Simulate misaligned Node.js Buffer (byteOffset=3, not multiple of 8)
  const padded = new Uint8Array(encoded.length + 3);
  padded.set(encoded, 3);
  const misaligned = Buffer.from(padded.buffer, 3, encoded.length);

  test(`${label} (misaligned buffer, byteOffset=${misaligned.byteOffset})`, () => {
    decode(misaligned);
  });
}

console.log("Vector/Matrix BEAST2 decode with misaligned Buffer:\n");

roundTrip("Vector<Integer>", VectorType(IntegerType), BigInt64Array.from([1n, 2n, 3n]));
roundTrip("Vector<Float>", VectorType(FloatType), Float64Array.from([1.0, 2.5, 3.7]));
roundTrip("Vector<Boolean>", VectorType(BooleanType), Uint8ClampedArray.from([1, 0, 1]));
roundTrip("Matrix<Integer>", MatrixType(IntegerType), matrix(BigInt64Array.from([1n, 2n, 3n, 4n]), 2, 2));
roundTrip("Matrix<Float>", MatrixType(FloatType), matrix(Float64Array.from([1.0, 2.0, 3.0, 4.0]), 2, 2));
roundTrip("Matrix<Boolean>", MatrixType(BooleanType), matrix(Uint8ClampedArray.from([1, 0, 1, 0]), 2, 2));

console.log();
if (failures > 0) {
  console.log(`FAILED: ${failures} failures`);
  process.exit(1);
} else {
  console.log("All passed!");
}
