const express = require('express');
const cors = require('cors');
const os = require('os');
const cron = require('node-cron');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { error } = require('console');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bismillahenterpriseclus.eoxgyuj.mongodb.net/?retryWrites=true&w=majority&appName=BismillahEnterpriseCluster`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection


        const staffsCollection = client.db('Bismillah_Enterprise').collection('staffs');
        const shopLocationCollection = client.db('Bismillah_Enterprise').collection('shop_location');
        const userRequestCollection = client.db('Bismillah_Enterprise').collection('user_request');
        const shopCodeCollection = client.db('Bismillah_Enterprise').collection('shop_code');
        const additionalMovementRequestCollection = client.db('Bismillah_Enterprise').collection('additional_movement_request');
        const shopTransectionsCollection = client.db('Bismillah_Enterprise').collection('shop_transections');
        const shopTransectionsSummaryCollection = client.db('Bismillah_Enterprise').collection('shop_transections_summary');
        const noticePanelCollection = client.db('Bismillah_Enterprise').collection('notice_panel');
        const staffBonusCollection = client.db('Bismillah_Enterprise').collection('staff_bonus');
        const selfTransectionsCollection = client.db('Bismillah_Enterprise').collection('self_transections');
        const selfTransectionsSummaryCollection = client.db('Bismillah_Enterprise').collection('self_transections_summary');
        const clientCornerCollection = client.db('Bismillah_Enterprise').collection('client_corner');
        const airTicketClientCornerCollection = client.db('Bismillah_Enterprise').collection('air_ticket_client_corner');
        const voucherSlCollection = client.db('Bismillah_Enterprise').collection('voucher_sl_no');
        const productsCollection = client.db('Bismillah_Enterprise').collection('products');
        const tokenCollection = client.db('Bismillah_Enterprise').collection('tokens');

        app.get("/shop_code", async (req, res) => {
            const shopCode = await shopCodeCollection.findOne({});
            res.send(shopCode);
        })
        app.post('/shop_code', async (req, res) => {
            const options = { upsert: true };
            const updatedCode = req.body;
            try {
                const existing = await shopCodeCollection.findOne({});
                if (existing) {
                    await shopCodeCollection.updateOne(
                        { _id: existing._id },
                        { $set: { shop_code: updatedCode.shop_code } },
                        options
                    );
                } else {
                    await shopCodeCollection.insertOne({ shop_code: updatedCode.shop_code });
                }
                res.send({ message: 'shop code set successfully' });
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/additional_request_approve/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const options = { upsert: true };
            const updatedStatus = req.body;
            const movementStatus = {
                $set: {
                    additional_movement_status: updatedStatus.additional_movement_status
                }
            };

            try {
                const result = await staffsCollection.updateOne(filter, movementStatus, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.get("/staffs", async (req, res) => {
            const staffs = await staffsCollection.find().toArray();
            res.send(staffs);
        });
        app.get("/staff/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const staff = await staffsCollection.find(query).toArray();
            if (staff) {
                res.send(staff);
            }
            else {
                res.send({ message: 'You Are Waiting For Admin Approval' })
            }
        });
        app.get('/staff/uid_query/:uid', async (req, res) => {
            const uid = req.params.uid;
            try {
                const result = await staffsCollection.findOne({ uid: uid });
                if (result) {
                    res.send(result);
                }
                else {
                    res.send({ message: "UID not found" })
                }
            } catch (err) {
                res.status(500).send({ error: "Failed to query staffs by name" });
            }
        });

        app.post('/staff', async (req, res) => {
            const newStaff = req.body;
            try {
                const result = await staffsCollection.insertOne(newStaff);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })
        app.delete('/staff/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await staffsCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/user_request_uid/:uid', async (req, res) => {
            const uid = req.params.uid;

            try {
                const userRequest = await userRequestCollection.findOne({ uid });
                if (userRequest) {
                    res.send(userRequest);
                } else {
                    // ✅ Send null or empty object, NOT nothing
                    res.send({ message: 'UID not found' })
                }
            } catch (err) {
                res.status(500).send({ error: 'Server error checking user request' });
            }
        });
        app.post('/user_request', async (req, res) => {
            const user = req.body;
            try {
                const result = await userRequestCollection.insertOne(user);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        });
        app.get('/additional_movement_request', async (req, res) => {
            const result = await additionalMovementRequestCollection.find().toArray();
            res.send(result);
        })
        app.post('/additional_movement_request', async (req, res) => {
            const movementData = req.body;
            try {
                const result = await additionalMovementRequestCollection.insertOne(movementData);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert request" });
            }
        });
        app.delete('/additional_movement_request/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const result = await additionalMovementRequestCollection.deleteOne(filter);
            res.send(result);
        });


        app.get('/user_request', async (req, res) => {
            const user = await userRequestCollection.find().toArray();
            res.send(user);
        })
        app.delete('/user_request/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await userRequestCollection.deleteOne(filter);
            res.send(result);
        })
        app.post('/new_staff', async (req, res) => {
            const new_staff = req.body;
            const result = staffsCollection.insertOne(new_staff);
            res.send(result);
        })
        app.put('/staffs_daily_time/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTime = req.body;
            let attendance
            if (updatedTime.name == 'today_enter1_time') {
                attendance = {
                    $set: {
                        today_enter1_time: updatedTime.clickedTime,
                        today_date: updatedTime.today_date
                    }
                };
            }
            else if (updatedTime.name == 'today_exit1_time') {
                attendance = {
                    $set: {
                        today_exit1_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'today_enter2_time') {
                attendance = {
                    $set: {
                        today_enter2_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'today_exit2_time') {
                attendance = {
                    $set: {
                        today_exit2_time: updatedTime.clickedTime
                    }
                };
            }

            try {
                const result = await staffsCollection.updateOne(filter, attendance, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/additional_movements/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTime = req.body;
            let attendance
            if (updatedTime.name == 'additional_enter_time') {
                attendance = {
                    $set: {
                        additional_enter_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'additional_exit_time') {
                attendance = {
                    $set: {
                        additional_exit_time: updatedTime.clickedTime
                    }
                };
            }

            try {
                const result = await staffsCollection.updateOne(filter, attendance, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });


        // ✅ GET shop location
        app.get('/shop_location', async (req, res) => {
            try {
                const location = await shopLocationCollection.findOne({});
                if (!location) {
                    return res.status(404).json({ message: 'Shop location not found' });
                }
                res.json({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    shop_range: location.shop_range,
                });
            } catch (error) {
                console.error('GET /shop_location error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // ✅ POST update/insert shop location
        app.post('/shop_location', async (req, res) => {
            const { latitude, longitude, shop_range } = req.body;

            if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof shop_range !== 'number') {
                return res.status(400).json({ error: 'Latitude and Longitude must be numbers' });
            }

            try {
                const existing = await shopLocationCollection.findOne({});
                if (existing) {
                    await shopLocationCollection.updateOne(
                        { _id: existing._id },
                        { $set: { latitude, longitude, shop_range } }
                    );
                } else {
                    await shopLocationCollection.insertOne({ latitude, longitude, shop_range });
                }
                res.json({ message: 'Shop location saved successfully' });
            } catch (error) {
                console.error('POST /shop_location error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.put('/submit_work_time/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const todaySummary = {
                current_date: bodyData.currentDate,
                current_day_name: bodyData.currentDayName,
                today_enter1_time: bodyData.today_enter1_time,
                today_exit1_time: bodyData.today_exit1_time,
                today_enter2_time: bodyData.today_enter2_time,
                today_exit2_time: bodyData.today_exit2_time,
                total_hour: bodyData.total_hour,
                total_minute: bodyData.total_minute,
                today_bonus: bodyData.today_bonus,
                total_earn: bodyData.total_earn,
                additional_movement_hour: bodyData.additional_movement_hour,
                additional_movement_minute: bodyData.additional_movement_minute

            }
            const filter = { _id: new ObjectId(id) };

            try {
                // Update database: Push daily data & reset today's values
                const updateDoc = {
                    $push: { current_month_details: todaySummary },
                    $set: {
                        total_working_hour: bodyData.total_working_hour,
                        total_working_minute: bodyData.total_working_minute,
                        total_income: bodyData.total_income,
                        available_balance: bodyData.available_balance,
                        today_date: bodyData.today_date,
                        today_enter1_time: '',
                        today_exit1_time: '',
                        today_enter2_time: '',
                        today_exit2_time: '',
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0,
                        bonus: bodyData.total_bonus
                    }
                };
                const ErrorDoc = {
                    $set: {
                        today_date: bodyData.today_date,
                        today_enter1_time: '',
                        today_exit1_time: '',
                        today_enter2_time: '',
                        today_exit2_time: '',
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0
                    }
                }
                if (bodyData.today_exit1_time === '' && bodyData.today_exit2_time === '') {
                    await staffsCollection.updateOne(filter, ErrorDoc, { upsert: true });
                    res.send({ message: 'Work time submitted successfully' });
                }
                else {
                    await staffsCollection.updateOne(filter, updateDoc, { upsert: true });
                    res.send({ message: 'Work time submitted successfully' });
                }
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.put('/additional_movement_submit/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            try {
                // Update database: Push daily data & reset today's values
                const updateDoc = {
                    $set: {
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: bodyData.additional_movement_hour,
                        additional_movement_minute: bodyData.additional_movement_minute
                    }
                };
                const ErrorDoc = {
                    $set: {
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0
                    }
                }
                if (bodyData.additional_enter_time === '') {
                    const result = await staffsCollection.updateOne(filter, ErrorDoc);
                    res.send(result);
                }
                else {
                    const result = await staffsCollection.updateOne(filter, updateDoc);
                    res.send(result);
                }
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });


        app.put('/transection_details/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            const newTransectionsData = {
                transection_id: bodyData.transection_id,
                transection_date: bodyData.currentDate,
                transection_amount: bodyData.transection_amount,
                transection_type: bodyData.transection_type,
                comment: bodyData.comment
            };

            try {
                const staff = await staffsCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (staff?.transections?.length > 19) {
                    await staffsCollection.updateOne(filter, { $pop: { transections: -1 } }); // remove first
                }

                // Step 2: Push new transection + update balances
                if (bodyData.transection_type === 'Payback Lend') {
                    const new_withdrawal_amount = bodyData.previous_withdrawal_amount - bodyData.transection_amount;
                    const new_available_balance = bodyData.previous_available_balance + bodyData.transection_amount
                    const updateDoc = {
                        $push: {
                            transections: newTransectionsData
                        },
                        $set: {
                            withdrawal_amount: new_withdrawal_amount,
                            available_balance: new_available_balance
                        }
                    };

                    const result = await staffsCollection.updateOne(filter, updateDoc);
                    res.send(result);
                }
                else {
                    const updateDoc = {
                        $push: {
                            transections: newTransectionsData
                        },
                        $set: {
                            withdrawal_amount: bodyData.withdrawal_amount,
                            available_balance: bodyData.available_balance
                        }
                    };

                    const result = await staffsCollection.updateOne(filter, updateDoc);
                    res.send(result);
                }

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.put('/closing_month/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            const newIncomeHistory = {
                month_name: bodyData.month_name,
                total_worked_time: `${bodyData.total_working_hour} Hour, ${bodyData.total_working_minute} Minute`,
                previous_due: bodyData.last_month_due,
                total_income: bodyData.total_income,
                paid_amount: bodyData.paid_amount,
                receiveable_amount: bodyData.last_month_due,
                paid_date: bodyData.paid_date,
            };

            try {
                const staff = await staffsCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (staff?.income_history?.length > 12) {
                    await staffsCollection.updateOne(filter, { $pop: { income_history: -1 } }); // remove first
                }

                // Step 2: Push new transection + update balances
                const updateDoc = {
                    $push: {
                        income_history: newIncomeHistory
                    },
                    $set: {
                        total_income: 0,
                        bonus: 0,
                        fine: 0,
                        total_working_hour: 0,
                        total_working_minute: 0,
                        withdrawal_amount: 0,
                        available_balance: bodyData.last_month_due,
                        last_month_due: bodyData.last_month_due,
                        current_month_details: [],
                        current_working_month: bodyData.current_working_month
                    }
                };

                const result = await staffsCollection.updateOne(filter, updateDoc);
                res.send(result);

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.post('/shop_transections_closing_month', async (req, res) => {
            const bodyData = req.body;
            try {
                const existing = await shopTransectionsCollection.findOne({});
                if (existing) {
                    await shopTransectionsSummaryCollection.insertOne(bodyData);
                    await shopTransectionsCollection.updateOne(
                        { _id: existing._id },
                        { $set: { month_name: '', total_revenue_amount: 0, total_expense_amount: 0, hand_on_cash: bodyData.hand_on_cash, revenue_transections: [], expense_transections: [] } }
                    );
                } else {
                    await shopTransectionsCollection.insertOne(bodyData);
                }
                res.json({ message: 'Shop transections saved successfully' });

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.post('/self_transections_closing_month', async (req, res) => {
            const bodyData = req.body;
            try {
                const existing = await selfTransectionsCollection.findOne({});
                if (existing) {
                    await selfTransectionsSummaryCollection.insertOne(bodyData);
                    await selfTransectionsCollection.updateOne(
                        { _id: existing._id },
                        { $set: { month_name: '', total_revenue_amount: 0, total_expense_amount: 0, hand_on_cash: bodyData.hand_on_cash, revenue_transections: [], expense_transections: [] } }
                    );
                } else {
                    await selfTransectionsCollection.insertOne(bodyData);
                }
                res.json({ message: 'Shop transections saved successfully' });

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.put('/start_new_month', async (req, res) => {
            const bodyData = req.body;
            try {
                const existing = await shopTransectionsCollection.findOne({});
                const result = await shopTransectionsCollection.updateOne(
                    { _id: existing._id },
                    { $set: { month_name: bodyData.month_name } }
                );
                res.send(result)
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        })
        app.put('/self_start_new_month', async (req, res) => {
            const bodyData = req.body;
            try {
                const existing = await selfTransectionsCollection.findOne({});
                const result = await selfTransectionsCollection.updateOne(
                    { _id: existing._id },
                    { $set: { month_name: bodyData.month_name } }
                );
                res.send(result)
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        })

        app.put('/set_user_category/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const options = { upsert: true };
            const updated = req.body;
            const newUserCategory = {
                $set: {
                    user_category: updated.user_category
                }
            };

            try {
                const result = await staffsCollection.updateOne(filter, newUserCategory, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/set_user_status/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const options = { upsert: true };
            const updated = req.body;
            const newUserCategory = {
                $set: {
                    status: updated.status
                }
            };

            try {
                const result = await staffsCollection.updateOne(filter, newUserCategory, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.get('/shop_transections', async (req, res) => {
            const result = await shopTransectionsCollection.find().toArray();
            res.send(result);
        });
        app.put('/shop_transections', async (req, res) => {
            const filter = { _id: new ObjectId(process.env.Shop_Transections_ObjectId) }
            const bodyData = req.body;
            const transection = {
                transection_id: bodyData.transection_id,
                transection_date: bodyData.transection_date,
                transection_amount: bodyData.transection_amount,
                transection_explaination: bodyData.transection_explaination
            }
            if (bodyData.transection_type === 'revenue') {
                const updateDoc = {
                    $push: {
                        revenue_transections: transection
                    },
                    $set: {
                        total_revenue_amount: bodyData.total_revenue_amount,
                        hand_on_cash: bodyData.hand_on_cash
                    }
                }
                const result = await shopTransectionsCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                const updateDoc = {
                    $push: {
                        expense_transections: transection
                    },
                    $set: {
                        total_expense_amount: bodyData.total_expense_amount,
                        hand_on_cash: bodyData.hand_on_cash
                    }
                }
                const result = await shopTransectionsCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
        })
        app.put('/self_transections', async (req, res) => {
            const filter = await selfTransectionsCollection.findOne({})
            const bodyData = req.body;
            const transection = {
                transection_id: bodyData.transection_id,
                transection_date: bodyData.transection_date,
                transection_amount: bodyData.transection_amount,
                transection_explaination: bodyData.transection_explaination
            }
            if (bodyData.transection_type === 'revenue') {
                const updateDoc = {
                    $push: {
                        revenue_transections: transection
                    },
                    $set: {
                        total_revenue_amount: bodyData.total_revenue_amount,
                        hand_on_cash: bodyData.hand_on_cash
                    }
                }
                const result = await selfTransectionsCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                const updateDoc = {
                    $push: {
                        expense_transections: transection
                    },
                    $set: {
                        total_expense_amount: bodyData.total_expense_amount,
                        hand_on_cash: bodyData.hand_on_cash
                    }
                }
                const result = await selfTransectionsCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
        })
        app.get('/shop_transections_summary', async (req, res) => {
            const result = await shopTransectionsSummaryCollection.find().toArray();
            res.send(result);
        });
        app.get('/notice_panel', async (req, res) => {
            const result = await noticePanelCollection.find().toArray();
            res.send(result);
        });
        app.post('/notice_panel', async (req, res) => {
            const options = { upsert: true };
            const updatedNotice = req.body;
            try {
                const existing = await noticePanelCollection.findOne({});
                if (existing) {
                    await noticePanelCollection.updateOne(
                        { _id: existing._id },
                        { $set: { notice: updatedNotice.notice } },
                        options
                    );
                } else {
                    await noticePanelCollection.insertOne({ notice: updatedNotice.notice });
                }
                res.send({ message: 'notice set successfully' });
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.get('/staff_bonus', async (req, res) => {
            const result = await staffBonusCollection.findOne({});
            res.send(result);
        });
        app.put('/staff_bonus', async (req, res) => {
            const entryData = req.body;
            const existing = await staffBonusCollection.findOne({});

            if (entryData.entry_type === 'new day') {
                const result = await staffBonusCollection.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            date: entryData.date,
                            first_entry: { time: '', uid: '' },
                            second_entry: { time: '', uid: '' }
                        }
                    }
                );
                res.send(result);
            }
            if (entryData.entry_type === 'first entry') {
                const now = new Date();
                const parseTime = (timeStr) => {
                    if (!timeStr) return null;
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours !== 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };
                if (parseTime(entryData.time) < 480) {
                    const result = await staffBonusCollection.updateOne(
                        { _id: existing._id },
                        { $set: { first_entry: { time: '8:00 AM', uid: entryData.uid } } }
                    );
                    res.send(result);
                }
                if (parseTime(entryData.time) > 480 && parseTime(entryData.time) < 510) {
                    const result = await staffBonusCollection.updateOne(
                        { _id: existing._id },
                        { $set: { first_entry: { time: entryData.time, uid: entryData.uid } } }
                    );
                    res.send(result);
                }
            }
            if (entryData.entry_type === 'second entry') {
                const result = await staffBonusCollection.updateOne(
                    { _id: existing._id },
                    { $set: { second_entry: { time: entryData.time, uid: entryData.uid } } }
                );
                res.send(result);
            }
        })
        app.get('/self_transections', async (req, res) => {
            const result = await selfTransectionsCollection.find().toArray();
            res.send(result);
        });
        app.get('/self_transections_summary', async (req, res) => {
            const result = await selfTransectionsSummaryCollection.find().toArray();
            res.send(result);
        });
        app.get('/client_corner', async (req, res) => {
            const result = await clientCornerCollection.find().toArray();
            res.send(result);
        });
        app.get('/client_details/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await clientCornerCollection.findOne(filter);
            res.send(result);
        });
        app.delete('/client/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await clientCornerCollection.deleteOne(filter);
            res.send(result);
        });
        app.post('/new_client', async (req, res) => {
            const clientData = req.body;
            const result = await clientCornerCollection.insertOne(clientData);
            res.send(result);
        })
        app.get('/air_ticket_client_corner', async (req, res) => {
            const result = await airTicketClientCornerCollection.find().toArray();
            res.send(result);
        });
        app.get('/air_ticket_client_details/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await airTicketClientCornerCollection.findOne(filter);
            res.send(result);
        });
        app.delete('/air_ticket_client/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await airTicketClientCornerCollection.deleteOne(filter);
            res.send(result);
        });
        app.post('/air_ticket_new_client', async (req, res) => {
            const clientData = req.body;
            const result = await airTicketClientCornerCollection.insertOne(clientData);
            res.send(result);
        })
        app.get('/voucher_sl', async (req, res) => {
            const result = await voucherSlCollection.findOne({});
            res.send(result);
        });
        app.post('/voucher_sl', async (req, res) => {
            const options = { upsert: true };
            const updatedSl = req.body;
            try {
                const existing = await voucherSlCollection.findOne({});
                if (existing) {
                    await voucherSlCollection.updateOne(
                        { _id: existing._id },
                        { $set: { sl_no: updatedSl.new_sl_no } },
                        options
                    );
                } else {
                    await voucherSlCollection.insertOne({ sl_no: updatedSl.new_sl_no });
                }
                res.send({ message: 'new sl set successfully' });
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/new_voucher/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const Data = req.body;
            const voucher = {
                date: Data.date,
                voucher_no: String(Data.voucher_no),
                products: Data.products,
                total: Data.total,
                paid_amount: Data.paid_amount,
                due_amount: Data.due_amount,
                payment_status: Data.payment_status,
                discount: Data.discount
            }
            try {
                const client = await clientCornerCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (client?.vouchers?.length > 10) {
                    await clientCornerCollection.updateOne(filter, { $pop: { vouchers: -1 } }); // remove first
                }
                const result = await clientCornerCollection.updateOne(
                    filter,
                    { $push: { vouchers: voucher } },
                    options
                );
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/air_ticket_new_voucher/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const Data = req.body;
            const voucher = {
                date: Data.date,
                voucher_no: String(Data.voucher_no),
                destination: Data.destination,
                flight_date: Data.flight_date,
                ticket_price: Data.ticket_price,
                paid_amount: Data.paid_amount,
                due_amount: Data.due_amount,
                payment_status: Data.payment_status,
                discount: Data.discount
            }
            try {
                const client = await airTicketClientCornerCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (client?.vouchers?.length > 10) {
                    await airTicketClientCornerCollection.updateOne(filter, { $pop: { vouchers: -1 } }); // remove first
                }
                const result = await airTicketClientCornerCollection.updateOne(
                    filter,
                    { $push: { vouchers: voucher } },
                    options
                );
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/take_payment/:id', async (req, res) => {
            const id = req.params.id;
            const Data = req.body;
            const filter = { _id: new ObjectId(id), 'vouchers.voucher_no': Data.voucher_no };
            const clientFilter = { _id: new ObjectId(id) };
            const transection = {
                date: Data.date,
                reference_voucher: String(Data.reference_voucher),
                paid_amount: Data.paid_amount,
                transection_amount: Data.transection_amount,
                due_amount: Data.due,
                payment_status: Data.payment_status
            }
            try {
                const client = await clientCornerCollection.findOne(clientFilter);
                console.log(client.transections.length)
                // Step 1: If length > 19, remove first transection
                if (client?.transections?.length > 15) {
                    await clientCornerCollection.updateOne(filter, { $pop: { transections: -1 } }); // remove first
                }
                const result = await clientCornerCollection.updateOne(
                    filter,
                    {
                        $set: {
                            'vouchers.$.paid_amount': Data.paid_amount,
                            'vouchers.$.due_amount': Data.due,
                            'vouchers.$.payment_status': Data.payment_status,
                            'vouchers.$.discount': Data.discount
                        }, $push: { transections: transection }
                    }
                );
                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: 'updated' });
                } else {
                    res.status(404).send({ success: false, message: 'Voucher not found' });
                }
            } catch (err) {
                console.log(err);
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/air_ticket_take_payment/:id', async (req, res) => {
            const id = req.params.id;
            const Data = req.body;
            const filter = { _id: new ObjectId(id), 'vouchers.voucher_no': Data.voucher_no };
            const clientFilter = { _id: new ObjectId(id) };
            const transection = {
                date: Data.date,
                reference_voucher: String(Data.reference_voucher),
                paid_amount: Data.paid_amount,
                transection_amount: Data.transection_amount,
                due_amount: Data.due,
                payment_status: Data.payment_status
            }
            try {
                const client = await airTicketClientCornerCollection.findOne(clientFilter);

                // Step 1: If length > 19, remove first transection
                if (client?.transections?.length > 15) {
                    await airTicketClientCornerCollection.updateOne(filter, { $pop: { transections: -1 } }); // remove first
                }
                const result = await airTicketClientCornerCollection.updateOne(
                    filter,
                    {
                        $set: {
                            'vouchers.$.paid_amount': Data.paid_amount,
                            'vouchers.$.due_amount': Data.due,
                            'vouchers.$.payment_status': Data.payment_status,
                            'vouchers.$.discount': Data.discount
                        }, $push: { transections: transection }
                    }
                );
                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: 'updated' });
                } else {
                    res.status(404).send({ success: false, message: 'Voucher not found' });
                }
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/hour_rate/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body;
            const result = await staffsCollection.updateOne(filter, {
                $set: {
                    hour_rate: bodyData.hour_rate
                }
            })
            res.send(result);
        });
        app.put('/payback_loan/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body;
            const result = await staffsCollection.updateOne(filter, {
                $set: {
                    withdrawal_amount: bodyData.withdrawal_amount,
                    available_balance: bodyData.available_balance
                }
            });
            res.send(result);
        });

        app.get('/products', async (req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        });
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        });
        app.put('/replace_staff/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body;
            const result = await staffsCollection.updateOne(filter, {
                $set: {
                    email: bodyData.email,
                    uid: bodyData.uid
                }
            });
            res.send(result);
        });
        app.put('/change_time/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body;
            if (bodyData.name === 'today_enter1_time') {
                const result = await staffsCollection.updateOne(filter, {
                    $set: {
                        today_enter1_time: bodyData.time,
                    }
                });
                res.send(result);
            }
            if (bodyData.name === 'today_exit1_time') {
                const result = await staffsCollection.updateOne(filter, {
                    $set: {
                        today_exit1_time: bodyData.time,
                    }
                });
                res.send(result);
            }
            if (bodyData.name === 'today_enter2_time') {
                const result = await staffsCollection.updateOne(filter, {
                    $set: {
                        today_enter2_time: bodyData.time,
                    }
                });
                res.send(result);
            }
            if (bodyData.name === 'today_exit2_time') {
                const result = await staffsCollection.updateOne(filter, {
                    $set: {
                        today_exit2_time: bodyData.time,
                    }
                });
                res.send(result);
            }
        });

        app.put('/clear_bonus', async (req, res) => {
            const bodyData = req.body;
            const existing = await staffBonusCollection.findOne({});
            if (bodyData.name === 'first_entry') {
                const result = await staffBonusCollection.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            first_entry: { time: '', uid: '' },
                        }
                    }
                );
                res.send(result);
            }
            if (bodyData.name === 'second_entry') {
                const result = await staffBonusCollection.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            second_entry: { time: '', uid: '' },
                        }
                    }
                );
                res.send(result);
            }
        })


        app.patch('/staff/remove_attendance/:id', async (req, res) => {
            const { id } = req.params;
            const { dateToRemove } = req.body;

            try {
                const staff = await staffsCollection.findOne({ _id: new ObjectId(id) });
                if (!staff) return res.status(404).send({ message: 'Staff not found' });

                const oldDetails = staff.current_month_details || [];
                // Find the day to delete
                const dayToDelete = oldDetails.find(item => item.current_date === dateToRemove);
                if (!dayToDelete) return res.status(404).send({ message: 'Date not found' });

                // ✅ Now recalculate totals from the updatedDetails array
                let total_income = 0;
                let bonus = 0;
                let available_balance = 0;
                let total_working_hour = 0;
                let total_working_minute = 0;

                const previousTotalWorkingMinute = (staff.total_working_hour * 60) + staff.total_working_minute;
                const deletedTotalWorkingMinute = (dayToDelete.total_hour * 60) + dayToDelete.total_minute;
                const updatedTotalWorkingMinute = previousTotalWorkingMinute - deletedTotalWorkingMinute;
                total_income = parseFloat((staff.total_income - dayToDelete.total_earn).toFixed(2));
                bonus = staff.bonus - dayToDelete.today_bonus;
                available_balance = parseFloat((staff.available_balance - dayToDelete.total_earn).toFixed(2));
                total_working_hour = Math.floor(updatedTotalWorkingMinute / 60);
                total_working_minute = updatedTotalWorkingMinute % 60;


                // ✅ Update the document
                const result = await staffsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            total_income,
                            bonus,
                            available_balance,
                            total_working_hour,
                            total_working_minute
                        },
                        $pull: {
                            current_month_details: { current_date: dateToRemove }
                        }
                    }
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({ message: '❌ Server error', error: err.message });
            }
        });
        app.patch('/edit_voucher/:id', async (req, res) => {
            const { id } = req.params;
            const { voucher_no, products, total, due_amount, status } = req.body;

            try {
                const filter = { _id: new ObjectId(id), 'vouchers.voucher_no': voucher_no };
                // ✅ Update the document
                const result = await clientCornerCollection.updateOne(
                    filter,
                    {
                        $set: {
                            'vouchers.$.products': products,
                            'vouchers.$.due_amount': due_amount,
                            'vouchers.$.payment_status': status,
                            'vouchers.$.total': total
                        }
                    }
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({ message: '❌ Server error', error: err.message });
            }
        });
        app.patch('/edit_client_data/:id', async (req, res) => {
            const { id } = req.params;
            const { name, on_behalf, address, mobile_no } = req.body;

            try {
                const filter = { _id: new ObjectId(id) };
                // ✅ Update the document
                const result = await clientCornerCollection.updateOne(
                    filter,
                    {
                        $set: {
                            name,
                            on_behalf,
                            mobile_no,
                            address
                        }
                    }
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({ message: '❌ Server error', error: err.message });
            }
        });
        app.patch('/air_ticket_edit_client_data/:id', async (req, res) => {
            const { id } = req.params;
            const { name, address, mobile_no } = req.body;

            try {
                const filter = { _id: new ObjectId(id) };
                // ✅ Update the document
                const result = await airTicketClientCornerCollection.updateOne(
                    filter,
                    {
                        $set: {
                            name,
                            mobile_no,
                            address
                        }
                    }
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({ message: '❌ Server error', error: err.message });
            }
        });


        await client.db("admin").command({ ping: 1 });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Bismillah Enterprise is Running')
})

app.listen(port, () => {
    console.log(`bismillah enterprise is running on port: ${port}`)
})