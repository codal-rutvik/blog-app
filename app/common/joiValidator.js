const validateData = (data, schema) => {
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    return validationResult.error?.details?.[0]?.message || "An error occurred";
  }
  return validationResult.value;
};

module.exports = { validateData };
