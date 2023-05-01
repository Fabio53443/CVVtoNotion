import { Client } from "@notionhq/client";
import fs from "fs";
import pkg from 'classeviva.js';
const { Rest, Enums } = pkg;
const notion = new Client({
  auth: "NOTIONAPIKEY",
});

const databaseId = "DATABASEID";
let evtID;
let evtstart;
let authnam;
let notes;
let surname;
let skip;
let pagetitle;

const classeviva = new Rest({
  username: 'CVVUSERNAME',
  password: 'CVVPSWD!',
  app: Enums.Apps.Students, //Optional: default is Enums.Apps.Students
  state: Enums.States.Italy, //Optional: default is Enums.States.Italy
  debug: false, //Optional: default is false, if true it will log some info
  saveTempFile: true, //Optional: default is true, it will save a file with login temp token to avoid hitting the server again if not expired
});

async function agendafun() {
  await classeviva.login();
  let today = new Date().toISOString().split('T')[0];
  let nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth = nextMonth.toISOString().split('T')[0];
  let agenda = await classeviva.getAgenda("all", today, nextMonth);
  fs.writeFileSync('agenda.json', JSON.stringify(agenda));
  setTimeout(() => {
    classeviva.logout();
  }, 3500);
  return agenda;
}


async function addItem(title, evtID, evtstart, authnam, notes) {

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },

      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        evtID: {
          type: "number",
          number: evtID,
        },
        evtDatetimeBegin: {
          type: "date",
          date: {
            start: evtstart,
            end: null,
          },
        },
        authorName: {
          type: "rich_text",
          rich_text: [
            {
              text: {
                content: authnam,
              },
            },
          ],
        },
      },
        
      children: [
        {
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": notes,
                },
            
              },
            ],
            },
          },
        ],
    });
    console.log("Success! Entry added.");
  } catch (error) {
    console.error(error.body);
  }
}
async function query() {
  const queryResponse = await notion.databases.query({
    database_id: databaseId,
  });
  // queryResponse.results[i].properties.evtID.number for every document in the json
  let alreadyin = [];
  for (let i = 0; i < queryResponse.results.length; i++) {
    alreadyin.push(queryResponse.results[i].properties.evtID.number);
  }
  return alreadyin;
} await query()
  .then((alreadyin) => { skip = alreadyin; });

let agenda = await agendafun();
for (let i = 0; i < agenda.length; i++) {
  evtID = agenda[i].evtId;
  console.log(evtID);
  notes = agenda[i].notes;
  evtstart = agenda[i].evtDatetimeBegin.split("T")[0];
  authnam = agenda[i].authorName;
  authnam = authnam.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
  surname = authnam.split(" ")[0];
  pagetitle = `${surname}, ${evtstart}`;
  // console log everything

  if (skip.includes(evtID)) {
    console.log("Already in database, skipping...");
    continue;
  } else {
    console.log("Not in database, adding...");
    await addItem(pagetitle, evtID, evtstart, authnam, notes);
  }

}
process.exit();
