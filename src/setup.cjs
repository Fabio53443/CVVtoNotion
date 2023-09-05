const readline = require('readline');
const filesystem = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Welcome to the setup of the Notion CVV Sync script. Please follow the instructions below");

try {
  filesystem.readFileSync("secrets.json");
} catch (e) {
  filesystem.writeFileSync("secrets.json", "{}");
}

let secrets = JSON.parse(filesystem.readFileSync("secrets.json"));
const fields = ["NOTION_KEY", "DB_ID", "CVV_ID", "CVV_PSWD"];

function promptUserForField(index) {
  if (index >= fields.length) {
    rl.close();
    console.log("Setup complete. You can now run \"npm run sync\". Edit " + __dirname + "/secrets.json to change them.");
    return;
  }

  const field = fields[index];
  if (!secrets[field]) {
    rl.question(`Please enter the value for ${field}: `, (answer) => {
      secrets[field] = answer;
      filesystem.writeFileSync("secrets.json", JSON.stringify(secrets));
      promptUserForField(index + 1);
    });
  } else {
    promptUserForField(index + 1);
  }
}

promptUserForField(0);

