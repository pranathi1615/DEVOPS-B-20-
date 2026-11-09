const { Parser } = require('json2csv');

const generateCSV = (data, fields) => {
  try {
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(data);
  } catch (err) {
    throw new Error(`Failed to generate CSV: ${err.message}`);
  }
};

module.exports = { generateCSV };
