import { Client } from "@notionhq/client";
import fs from "fs";
import * as dotenv from "dotenv";
import pkg from "classeviva.js";
import path from "path";
const { Rest, Enums } = pkg;

//check if every variale is filled else raise error

export function firstLetterAllWordsUpper(sentence) {
  const words = sentence.split(" ");

  for (let i = 0; i < words.length; i++) {
    if (words[i].length <= 1) continue;
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(" ");
}

function getJSONSecrets(path) {
  if (!fs.existsSync(path)) {
    console.log("Please run npm run setup first!");
    process.exit();
  }

  const secrets = JSON.parse(fs.readFileSync("secrets.json"));
  const notionauth = secrets.NOTION_KEY;
  const cvvauth = secrets.CVV_ID;
  const cvvpswd = secrets.CVV_PSWD;
  const dbid = secrets.DB_ID;
  return { notionauth, cvvauth, cvvpswd, dbid };
}

async function fetchAgenda(cvvauth, cvvpswd) {

  console.log("Logging in to ClasseViva...");
  const classeviva = new Rest({
    username: cvvauth,
    password: cvvpswd,
    app: Enums.Apps.Students,
    state: Enums.States.Italy,
    debug: false,
    saveTempFile: true,
  });
  console.log("Logged in to ClasseViva!");

  console.log("Fetching agenda...");
  await classeviva.login();
  let today = new Date();
  let nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  let agenda = await classeviva.getAgenda("all", today, nextMonth);
  setTimeout(() => {
    classeviva.logout();
  }, 3500);
  console.log("Agenda successfully fetched!");
  return agenda;
}

async function addItem(notion, title, evtID, evtstart, authnam, notes, subj, databaseId) {
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
        subject: {
          type: "rich_text",
          rich_text: [
            {
              text: {
                content: subj,
              },
            },
          ],
        },
      },

      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: notes,
                },
              },
            ],
          },
        },
      ],
    });
    console.log("Success! Entry added.");
  } catch (error) {
    console.error(error);
  }
  }


async function query(notion, databaseId) {
  console.log("Querying database...");

  const queryResponse = await notion.databases.query({
    database_id: databaseId,
  });
  let alreadyin = [];
  for (let i = 0; i < queryResponse.results.length; i++) {
    alreadyin.push(queryResponse.results[i].properties.evtID.number);
  }
  return alreadyin;
}

async function syncAgenda(agenda, notion, databaseId) {
  let evtID, evtstart, authnam, notes, surname, skip, pagetitle, subj;
  skip = await query(notion, databaseId);
  for (let i = 0; i < agenda.length; i++) {
    evtID = agenda[i].evtId;
    notes = agenda[i].notes;
    evtstart = agenda[i].evtDatetimeBegin.split("T")[0];
    authnam = agenda[i].authorName;
    authnam = authnam.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });

    surname = authnam.split(" ")[0];
    if (surname === "Di") {
      surname = surname + " " + authnam.split(" ")[1];
    }
    let subj = firstLetterAllWordsUpper(agenda[i].subjectDesc.toLowerCase());

    pagetitle = `${subj}, ${evtstart}`;

    if (skip.includes(evtID)) {
      console.log(evtID + " already in database, skipping...");
      continue;
    } else {
      console.log("Not in database, adding...");
      await addItem(notion, pagetitle, evtID, evtstart, authnam, notes, subj, databaseId);
    }
  }
}

async function main(notionauth, cvvauth, cvvpswd, dbid) {

  console.log(`
      █▒▒    █▒▒         █▒▒ █▒▒         █▒▒        █▒▒                   █▒▒▒     █▒▒              █▒▒                           
    █▒▒   █▒▒  █▒▒       █▒▒   █▒▒       █▒▒         █▒▒                   █▒ █▒▒   █▒▒              █▒▒    █▒                     
  █▒▒          █▒▒     █▒▒     █▒▒     █▒▒        █▒█▒ █▒    █▒▒          █▒▒ █▒▒  █▒▒    █▒▒     █▒█▒ █▒        █▒▒     █▒▒ █▒▒  
  █▒▒           █▒▒   █▒▒       █▒▒   █▒▒           █▒▒    █▒▒  █▒▒       █▒▒  █▒▒ █▒▒  █▒▒  █▒▒    █▒▒   █▒▒  █▒▒  █▒▒   █▒▒  █▒▒
  █▒▒            █▒▒ █▒▒         █▒▒ █▒▒            █▒▒   █▒▒    █▒▒      █▒▒   █▒ █▒▒ █▒▒    █▒▒   █▒▒   █▒▒ █▒▒    █▒▒  █▒▒  █▒▒
    █▒▒   █▒▒      █▒▒▒▒           █▒▒▒▒             █▒▒    █▒▒  █▒▒       █▒▒    █▒ ▒▒  █▒▒  █▒▒    █▒▒   █▒▒  █▒▒  █▒▒   █▒▒  █▒▒
      █▒▒▒▒         █▒▒             █▒▒               █▒▒     █▒▒          █▒▒      █▒▒    █▒▒        █▒▒  █▒▒    █▒▒     █▒▒▒  █▒▒

  `);
  console.log(
    "Version: 1.2.0 | Made by @fabio53443. https://github.com/Fabio53443/CVVtoNotion\n"
  );

  console.log(`Logged in CVV as ${cvvauth}. Not you? Edit secrets.json.`);

  const notion =  new Client({
    auth: notionauth,
  });

  let notionemail = await notion.users.me();
  console.log(`Connected to Notion with the "${notionemail.name}" integration.`)
  
  let agenda = await fetchAgenda(cvvauth, cvvpswd);
  await syncAgenda(agenda, notion, dbid);

}

const { notionauth, cvvauth, cvvpswd, dbid } = getJSONSecrets("secrets.json");
main(notionauth, cvvauth, cvvpswd, dbid);
