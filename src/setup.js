const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Inserisci i dati di accesso a Notion e a CVV");
rl.question('Enter NOTION_KEY: ', (notionKey) => {
  process.env.NOTION_KEY = notionKey;
  
  rl.question('Enter DB_ID: ', (dbId) => {
    process.env.DB_ID = dbId;

    rl.question('Enter CVV_ID: ', (cvvId) => {
      process.env.CVV_ID = cvvId;

      rl.question('Enter CVV_PSWD: ', (cvvPwd) => {
        process.env.CVV_PSWD = cvvPwd;

        rl.close();
      });
    });
  });
});
