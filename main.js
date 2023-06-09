import { Client } from "@notionhq/client";
import fs from "fs";
import * as dotenv from "dotenv";
import pkg from "classeviva.js";
const { Rest, Enums } = pkg;
dotenv.config();
import express from "express";


//KEYS!
let notionauth = process.env.NOTION_KEY;
let cvvauth = process.env.CVV_ID;
let cvvpswd = process.env.CVV_PSWD;
let dbid = process.env.DB_ID;



const notion = new Client({
  auth: notionauth,
});

const databaseId = dbid;
let evtID, evtstart, authnam, notes, surname, skip, pagetitle;

const classeviva = new Rest({
  username: cvvauth,
  password: cvvpswd,
  app: Enums.Apps.Students, 
  state: Enums.States.Italy, 
  debug: false, 
  saveTempFile: true,
});

async function agendafun() {
  await classeviva.login();
  let today = new Date().toISOString().split("T")[0];
  let nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth = nextMonth.toISOString().split("T")[0];
  let agenda = await classeviva.getAgenda("all", today, nextMonth);
  fs.writeFileSync("agenda.json", JSON.stringify(agenda));
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
}
await query().then((alreadyin) => {
  skip = alreadyin;
});

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
  if (surname === "Di") {
    surname = surname + " " + authnam.split(" ")[1];
  }

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
