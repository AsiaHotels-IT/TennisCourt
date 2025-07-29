use("test");

db.getCollection("users").insertMany([
  {
    _id: ObjectId("687f0757a1130c63aa729859"),
    username: "audit",
    password: "022170808",
    role: "auditor",
    createdAt: ISODate("2025-07-22T03:36:55.431Z"),
    updatedAt: ISODate("2025-07-22T03:57:22.794Z"),
    userID: 1,
    __v: 0,
    name: "Audit test"
  },
  {
    _id: ObjectId("687f73552994d85f0842931b"),
    username: "asia1",
    password: "1234",
    role: "cashier",
    createdAt: ISODate("2025-07-22T11:17:41.270Z"),
    updatedAt: ISODate("2025-07-22T11:17:41.270Z"),
    userID: 4,
    __v: 0,
    name: "Cashier Test"
  },
  {
    _id: ObjectId("68836954cf27164aa3562afc"),
    username: "asia2",
    name: "มานี มานะ",
    password: "1234",
    role: "cashier",
    adder: "Audit test",
    createdAt: ISODate("2025-07-25T11:24:04.099Z"),
    updatedAt: ISODate("2025-07-25T11:24:04.099Z"),
    userID: 6,
    __v: 0
  }
]);