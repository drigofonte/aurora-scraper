/**
 * Debug strict validation
 */

import { SchemaValidator } from "./src/pipeline/transformer/schema-validator.js";

async function debugStrictValidation() {
  console.log("🐛 Debugging Strict Validation");
  console.log("=".repeat(40));

  const validator = new SchemaValidator();

  // Schema with additionalProperties: false
  const strictSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      price: { type: "number" },
    },
    required: ["title"],
    additionalProperties: false,
  };

  validator.registerSchema("strict-schema", strictSchema);

  const dataWithExtraProps = {
    title: "Product with Extra",
    price: 29.99,
    extraField1: "not allowed",
    extraField2: 123,
  };

  console.log("🔍 Testing data:", JSON.stringify(dataWithExtraProps, null, 2));

  const result = validator.validateRecord(dataWithExtraProps, "strict-schema", { strict: true });

  if (result.isOk) {
    console.log("\n📊 Validation Result:");
    console.log(`- Valid: ${result.value.valid}`);
    console.log(`- Errors count: ${result.value.errors.length}`);
    console.log(`- Warnings count: ${result.value.warnings.length}`);

    if (result.value.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.value.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Field: ${error.field}`);
        console.log(`     Message: ${error.message}`);
        console.log(`     Value: ${JSON.stringify(error.value)}`);
      });
    }

    if (result.value.warnings.length > 0) {
      console.log("\n⚠️ Warnings:");
      result.value.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. Field: ${warning.field}`);
        console.log(`     Message: ${warning.message}`);
        console.log(`     Value: ${JSON.stringify(warning.value)}`);
      });
    }
  } else {
    console.error("❌ Validation failed:", result.error.message);
  }
}

// Run debug if this file is executed directly
if (import.meta.url.endsWith(process.argv[1] || "")) {
  debugStrictValidation().catch(console.error);
}

export { debugStrictValidation };
