const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const DB = "./db.json";

// LOAD DB
function loadDB(){
  if(!fs.existsSync(DB)) return {};
  return JSON.parse(fs.readFileSync(DB));
}

// SAVE DB
function saveDB(data){
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// CREATE LICENSE
function createLicense(email, plan){
  let db = loadDB();

  const key = "LIC-" + Math.random().toString(36).substring(2,10).toUpperCase();

  let duration = null;
  if(plan === "1week") duration = 7;
  if(plan === "3months") duration = 90;
  if(plan === "lifetime") duration = null;

  db[key] = {
    email,
    plan,
    created: Date.now(),
    expires: duration ? Date.now() + duration*24*60*60*1000 : null
  };

  saveDB(db);
  return key;
}

// CREATE (manual / PayPal hook)
app.post("/create",(req,res)=>{
  const {email,plan} = req.body;
  const key = createLicense(email,plan);
  res.json({key});
});

// VERIFY LICENSE
app.post("/verify",(req,res)=>{
  const {key} = req.body;

  let db = loadDB();
  let lic = db[key];

  if(!lic) return res.json({valid:false});

  if(lic.expires && Date.now() > lic.expires){
    return res.json({valid:false, expired:true});
  }

  res.json({valid:true,data:lic});
});

// DASHBOARD
app.post("/dashboard",(req,res)=>{
  const {email} = req.body;

  let db = loadDB();

  let found = Object.entries(db).find(([k,v])=>v.email===email);

  if(!found) return res.json({found:false});

  res.json({
    found:true,
    key:found[0],
    data:found[1]
  });
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log("API running");
});