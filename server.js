const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const settings = require("./settings");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.static("public"));
