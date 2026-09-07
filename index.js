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

const localUri = ``
const atlasUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bismillahenterpriseclus.eoxgyuj.mongodb.net/?retryWrites=true&w=majority&appName=BismillahEnterpriseCluster`;

const createClient = (uri) =>
    new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

let client;

async function connectDB() {
    try {
        console.log("Trying to connect to local MongoDB....");
        client = createClient(localUri);
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log("Connected to Local MongoDB");
    }
    catch (localError) {
        console.warn(" Local MongoDB not found. Switching to MOngoDB Atlas....");
        try {
            client = createClient(atlasUri);
            await client.connect();
            await client.db('admin').command({ ping: 1 });
            console.log("Connected to MongoDB Atlas");
        }
        catch (atlasError) {
            console.log("Faild to connet to both Local and Atlas MongoDB", atlasError);
            process.exit(1);
        }
    }
}


async function run() {
    try {

        await connectDB();


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
        const dailyTransactionsCollection = client.db('Bismillah_Enterprise').collection('daily_transactions');
        const colorplateCollection = client.db('Bismillah_Enterprise').collection('colorplate');

        app.get("/shop_code", async (req, res) => {
            try {
                const shopCode = await shopCodeCollection.findOne({});
                res.send(shopCode);

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.get('/colorplate/:serial', async (req, res) => {
            try {
                const serial = Number(req.params.serial);

                const colorData = await colorplateCollection.findOne({
                    serial: serial
                });

                if (!colorData) {
                    return res.status(404).send({
                        message: 'Color not found',
                        serial
                    });
                }

                res.send({
                    serial: colorData.serial,
                    color: colorData.color
                });
            }
            catch (error) {
                console.error('Color plate error:', error);

                res.status(500).send({
                    message: 'Failed to load color'
                });
            }
        });

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
                    await shopCodeCollection.insertOne({
                        shop_code: updatedCode.shop_code
                    });
                }

                res.send({ message: 'shop code set successfully' });

            } catch (err) {
                res.status(500).send({
                    error: 'Update failed',
                    details: err
                });
            }
        });

        app.put('/additional_request_approve/:uid', async (req, res) => {
            const uid = req.params.uid;
            console.log(uid);

            const filter = { uid: uid };

            const updatedStatus = req.body;

            const movementStatus = {
                $set: {
                    additional_movement_status:
                        updatedStatus.additional_movement_status
                }
            };

            try {
                const result = await staffsCollection.updateOne(
                    filter,
                    movementStatus
                );

                res.send(result);

            } catch (err) {
                res.status(500).send({
                    error: 'Update failed',
                    details: err
                });
            }
        });

        app.get("/staffs", async (req, res) => {
            try {
                const staffs = await staffsCollection.find().toArray();
                res.send(staffs);

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.get("/staff/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };

                const staff = await staffsCollection.find(query).toArray();

                if (staff) {
                    res.send(staff);
                }
                else {
                    res.send({
                        message: 'You Are Waiting For Admin Approval'
                    });
                }

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.get('/staff/uid_query/:uid', async (req, res) => {
            const uid = req.params.uid;

            try {
                const result = await staffsCollection.findOne({
                    uid: uid
                });

                if (result) {
                    res.send(result);
                }
                else {
                    res.send({
                        message: "UID not found"
                    });
                }

            } catch (err) {
                res.status(500).send({
                    error: "Failed to query staffs by name"
                });
            }
        });

        app.post('/staff', async (req, res) => {
            const newStaff = req.body;

            try {
                const result = await staffsCollection.insertOne(newStaff);
                res.send(result);

            } catch (err) {
                res.status(500).send({
                    error: "Failed to insert user request"
                });
            }
        });

        app.delete('/staff/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };

                const result = await staffsCollection.deleteOne(filter);

                res.send(result);

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.get('/user_request_uid/:uid', async (req, res) => {
            const uid = req.params.uid;

            try {
                const userRequest = await userRequestCollection.findOne({
                    uid
                });

                if (userRequest) {
                    res.send(userRequest);
                } else {
                    res.send({
                        message: 'UID not found'
                    });
                }

            } catch (err) {
                res.status(500).send({
                    error: 'Server error checking user request'
                });
            }
        });

        app.post('/user_request', async (req, res) => {
            const user = req.body;

            try {
                const result = await userRequestCollection.insertOne(user);
                res.send(result);

            } catch (err) {
                res.status(500).send({
                    error: "Failed to insert user request"
                });
            }
        });

        app.get('/additional_movement_request', async (req, res) => {
            try {
                const result =
                    await additionalMovementRequestCollection.find().toArray();

                res.send(result);

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.post('/additional_movement_request', async (req, res) => {
            const movementData = req.body;

            try {
                const result =
                    await additionalMovementRequestCollection.insertOne(
                        movementData
                    );

                res.send(result);

            } catch (err) {
                res.status(500).send({
                    error: "Failed to insert request"
                });
            }
        });

        app.delete('/additional_movement_request/:uid', async (req, res) => {
            try {
                const uid = req.params.uid;
                const filter = { uid: uid };

                const result =
                    await additionalMovementRequestCollection.deleteOne(filter);

                res.send(result);

            } catch (err) {
                console.error('API route error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        // --------------------------------------------------------------------------------------------------------
        app.get('/user_request', async (req, res) => {
            try {
                const user = await userRequestCollection.find().toArray();
                res.send(user);
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: 'Failed to fetch user requests',
                    details: err.message
                });
            }
        });


        app.delete('/user_request/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const result = await userRequestCollection.deleteOne(filter);
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: 'Delete failed',
                    details: err.message
                });
            }
        });


        app.post('/new_staff', async (req, res) => {
            try {
                const new_staff = req.body;
                const result = await staffsCollection.insertOne(new_staff);
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: 'Staff creation failed',
                    details: err.message
                });
            }
        });


        app.put('/staffs_daily_time/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedTime = req.body;
                const filter = { _id: new ObjectId(id) };
                const staff = await staffsCollection.findOne(filter);

                if (!staff) {
                    return res.status(404).send({ acknowledged: false, message: 'Staff not found' });
                }

                const submittedDate = updatedTime.current_date || updatedTime.currentDate;
                const submittedToday = submittedDate && Array.isArray(staff.current_month_details)
                    && staff.current_month_details.some(item => item?.current_date === submittedDate);

                // Once work time for a date has been submitted, no attendance can be added again.
                if (submittedToday) {
                    return res.status(409).send({
                        acknowledged: false,
                        message: 'Attendance for this date has already been submitted.'
                    });
                }

                // Never allow the same attendance slot to be overwritten by repeated requests.
                if (updatedTime.name && staff[updatedTime.name]) {
                    return res.status(409).send({
                        acknowledged: false,
                        message: 'This attendance time has already been recorded.'
                    });
                }

                const setData = {};
                if (updatedTime.name === 'today_enter1_time') {
                    setData.today_enter1_time = updatedTime.clickedTime;
                    setData.today_date = updatedTime.today_date;
                } else if (updatedTime.name === 'today_exit1_time') {
                    setData.today_exit1_time = updatedTime.clickedTime;
                } else if (updatedTime.name === 'today_enter2_time') {
                    setData.today_enter2_time = updatedTime.clickedTime;
                } else if (updatedTime.name === 'today_exit2_time') {
                    setData.today_exit2_time = updatedTime.clickedTime;
                } else {
                    return res.status(400).send({ acknowledged: false, message: 'Invalid attendance field.' });
                }

                const result = await staffsCollection.updateOne(filter, { $set: setData });
                return res.send(result);
            } catch (err) {
                console.error(err);
                return res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });

        app.put('/additional_movements/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const updatedTime = req.body;

                let attendance;

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

                const result = await staffsCollection.updateOne(
                    filter,
                    attendance,
                    options
                );

                res.send(result);

            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });


        // ✅ GET shop location
        app.get('/shop_location', async (req, res) => {
            try {
                const location = await shopLocationCollection.findOne({});

                if (!location) {
                    return res.status(404).json({
                        message: 'Shop location not found'
                    });
                }

                res.json({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    shop_range: location.shop_range,
                });

            } catch (error) {
                console.error('GET /shop_location error:', error);

                res.status(500).json({
                    error: 'Internal server error'
                });
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


        // ✅ POST update/insert shop location
        app.post('/shop_location', async (req, res) => {
            try {
                const {
                    latitude,
                    longitude,
                    shop_range
                } = req.body;

                if (
                    typeof latitude !== 'number' ||
                    typeof longitude !== 'number' ||
                    typeof shop_range !== 'number'
                ) {
                    return res.status(400).json({
                        error: 'Latitude and Longitude must be numbers'
                    });
                }

                const existing = await shopLocationCollection.findOne({});

                if (existing) {
                    await shopLocationCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                latitude,
                                longitude,
                                shop_range
                            }
                        }
                    );
                }
                else {
                    await shopLocationCollection.insertOne({
                        latitude,
                        longitude,
                        shop_range
                    });
                }

                res.json({
                    message: 'Shop location saved successfully'
                });

            } catch (error) {
                console.error('POST /shop_location error:', error);

                res.status(500).json({
                    error: 'Internal server error'
                });
            }
        });


        app.put('/submit_work_time/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const bodyData = req.body;
                const filter = { _id: new ObjectId(id) };
                const staff = await staffsCollection.findOne(filter);

                if (!staff) {
                    return res.status(404).send({ error: 'Staff not found' });
                }

                const submissionDate = bodyData.currentDate;
                if (!submissionDate) {
                    return res.status(400).send({ error: 'Current date is required.' });
                }

                // Server-side protection: one completed work-time submission per calendar date.
                const alreadySubmitted = Array.isArray(staff.current_month_details)
                    && staff.current_month_details.some(item => item?.current_date === submissionDate);

                if (alreadySubmitted) {
                    return res.status(409).send({
                        message: 'Work time for this date has already been submitted.'
                    });
                }

                const todaySummary = {
                    current_date: submissionDate,
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
                };

                // Keep the original behavior for incomplete attendance, but never create a duplicate daily record.
                if (bodyData.today_exit1_time === '' && bodyData.today_exit2_time === '') {
                    await staffsCollection.updateOne(filter, {
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
                    });
                    return res.send({ message: 'Work time submitted successfully' });
                }

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

                // Re-check in the update filter to protect against two simultaneous submit requests.
                const atomicResult = await staffsCollection.updateOne(
                    {
                        ...filter,
                        current_month_details: {
                            $not: { $elemMatch: { current_date: submissionDate } }
                        }
                    },
                    updateDoc
                );

                if (atomicResult.modifiedCount === 0) {
                    return res.status(409).send({
                        message: 'Work time for this date has already been submitted.'
                    });
                }

                return res.send({ message: 'Work time submitted successfully' });
            } catch (err) {
                console.error(err);
                return res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });

        app.put('/additional_movement_submit/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const bodyData = req.body;

                const filter = {
                    _id: new ObjectId(id)
                };

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
                };

                if (bodyData.additional_enter_time === '') {
                    const result = await staffsCollection.updateOne(
                        filter,
                        ErrorDoc
                    );

                    res.send(result);
                }
                else {
                    const result = await staffsCollection.updateOne(
                        filter,
                        updateDoc
                    );

                    res.send(result);
                }

            } catch (err) {
                console.error(err);

                res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });


        // ======================================================================================================================

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
                const result = await staffsCollection.updateOne(
                    filter,
                    newUserCategory,
                    options
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({
                    error: 'Update failed',
                    details: err
                });
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
                const result = await staffsCollection.updateOne(
                    filter,
                    newUserCategory,
                    options
                );

                res.send(result);
            } catch (err) {
                res.status(500).send({
                    error: 'Update failed',
                    details: err
                });
            }
        });

        app.get('/notice_panel', async (req, res) => {

            try {

                const result =
                    await noticePanelCollection.find().toArray();

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.post('/notice_panel', async (req, res) => {

            const options = { upsert: true };
            const updatedNotice = req.body;

            try {

                const existing =
                    await noticePanelCollection.findOne({});

                if (existing) {

                    await noticePanelCollection.updateOne(
                        { _id: existing._id },

                        {
                            $set: {
                                notice: updatedNotice.notice
                            }
                        },

                        options
                    );

                } else {

                    await noticePanelCollection.insertOne({
                        notice: updatedNotice.notice
                    });

                }

                res.send({
                    message: 'notice set successfully'
                });

            } catch (err) {

                res.status(500).send({
                    error: 'Update failed',
                    details: err
                });
            }
        });

        app.get('/staff_bonus', async (req, res) => {

            try {

                const result =
                    await staffBonusCollection.findOne({});

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.put('/staff_bonus', async (req, res) => {
            try {
                const entryData = req.body || {};
                let existing = await staffBonusCollection.findOne({});

                if (!existing) {
                    return res.status(404).send({ acknowledged: false, message: 'Staff bonus settings not found.' });
                }

                if (entryData.entry_type === 'new day') {
                    const result = await staffBonusCollection.updateOne(
                        { _id: existing._id, date: { $ne: entryData.date } },
                        {
                            $set: {
                                date: entryData.date,
                                first_entry: { time: '', uid: '' },
                                second_entry: { time: '', uid: '' }
                            }
                        }
                    );
                    return res.send(result);
                }

                if (entryData.entry_type !== 'first entry') {
                    return res.status(400).send({ acknowledged: false, message: 'Invalid bonus entry type.' });
                }

                const parseTime = (timeStr) => {
                    if (!timeStr) return null;
                    const parts = String(timeStr).trim().toUpperCase().split(/\s+/);
                    if (parts.length !== 2) return null;
                    const [time, modifier] = parts;
                    const values = time.split(':').map(Number);
                    if (values.length !== 2 || values.some(Number.isNaN)) return null;
                    let [hours, minutes] = values;
                    if (modifier === 'PM' && hours !== 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };

                const entryMinutes = parseTime(entryData.time);
                const startLimit = Number(existing.start_time);
                const endLimit = Number(existing.end_time);
                const requestedDate = entryData.date;

                if (requestedDate && existing.date !== requestedDate) {
                    await staffBonusCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                date: requestedDate,
                                first_entry: { time: '', uid: '' },
                                second_entry: { time: '', uid: '' }
                            }
                        }
                    );
                    existing = { ...existing, date: requestedDate, first_entry: { time: '', uid: '' }, second_entry: { time: '', uid: '' } };
                }

                if (entryMinutes === null || !Number.isFinite(startLimit) || !Number.isFinite(endLimit)) {
                    return res.status(400).send({ acknowledged: false, bonus: 0, message: 'Invalid bonus time.' });
                }

                // Bonus is available from start_time THROUGH end_time (both limits inclusive).
                if (entryMinutes < startLimit || entryMinutes > endLimit) {
                    return res.send({ acknowledged: true, bonus: 0, slot: null, message: 'Outside bonus time.' });
                }

                const uid = String(entryData.uid || '');
                if (!uid) {
                    return res.status(400).send({ acknowledged: false, bonus: 0, message: 'Staff UID is required.' });
                }

                // If this staff member already owns a bonus slot, never give another slot.
                if (existing.first_entry?.uid === uid) {
                    return res.send({ acknowledged: true, bonus: 50, slot: 'first_entry', message: 'First bonus already assigned.' });
                }
                if (existing.second_entry?.uid === uid) {
                    return res.send({ acknowledged: true, bonus: 20, slot: 'second_entry', message: 'Second bonus already assigned.' });
                }

                // Atomic claim for the first eligible staff member.
                const firstClaim = await staffBonusCollection.updateOne(
                    {
                        _id: existing._id,
                        date: existing.date,
                        'first_entry.uid': '',
                        'first_entry.time': '',
                        'second_entry.uid': { $ne: uid }
                    },
                    {
                        $set: {
                            first_entry: { time: entryData.time, uid }
                        }
                    }
                );

                if (firstClaim.modifiedCount === 1) {
                    return res.send({
                        acknowledged: true,
                        bonus: 50,
                        slot: 'first_entry',
                        message: 'First bonus assigned.'
                    });
                }

                // Atomic claim for the second eligible staff member.
                const secondClaim = await staffBonusCollection.updateOne(
                    {
                        _id: existing._id,
                        date: existing.date,
                        'second_entry.uid': '',
                        'second_entry.time': '',
                        'first_entry.uid': { $ne: uid }
                    },
                    {
                        $set: {
                            second_entry: { time: entryData.time, uid }
                        }
                    }
                );

                if (secondClaim.modifiedCount === 1) {
                    return res.send({
                        acknowledged: true,
                        bonus: 20,
                        slot: 'second_entry',
                        message: 'Second bonus assigned.'
                    });
                }

                return res.send({
                    acknowledged: true,
                    bonus: 0,
                    slot: null,
                    message: 'The two daily bonus slots are already occupied.'
                });
            } catch (err) {
                console.error('Staff bonus error:', err);
                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.patch('/set_bonus_time', async (req, res) => {

            try {

                const {
                    start_time,
                    end_time
                } = req.body;

                const existing =
                    await staffBonusCollection.findOne({});

                const result =
                    await staffBonusCollection.updateOne(
                        { _id: existing._id },

                        {
                            $set: {
                                start_time,
                                end_time
                            }
                        }
                    );

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });


        // ============================================      ============================================
        // ==============================================   ==============================================
        // ===============================================================================================




        app.get('/client_corner', async (req, res) => {

            try {

                const result =
                    await clientCornerCollection
                        .find()
                        .toArray();

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.get('/client_details/:id', async (req, res) => {

            try {

                const id = req.params.id;

                const filter = {
                    _id: new ObjectId(id)
                };

                const result =
                    await clientCornerCollection.findOne(filter);

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.delete('/client/:id', async (req, res) => {

            try {

                const id = req.params.id;

                const filter = {
                    _id: new ObjectId(id)
                };

                const result =
                    await clientCornerCollection.deleteOne(filter);

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        app.post('/new_client', async (req, res) => {

            try {

                const clientData = req.body;

                const result =
                    await clientCornerCollection.insertOne(
                        clientData
                    );

                res.send(result);

            } catch (err) {

                console.error('API route error:', err);

                return res.status(500).send({
                    error: 'Internal server error',
                    details: err.message
                });
            }
        });

        // =============================================================================================================================== Voucher Related


        // ================================== Update Voucher System =========================================


        const DAILY_CATEGORIES = ['Computer', 'Stationary', 'Photocopy', 'Others'];

        const money = (value) => {
            const number = Number(value);
            return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
        };

        const clone = (value) => JSON.parse(JSON.stringify(value));

        const getDateOnly = (value) => {
            if (!value) return '';
            const text = String(value).trim();
            const match = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
            return match ? `${match[1]} ${match[2]}, ${match[3]}` : text.split(',')[0].trim();
        };

        const getTodayDateOnly = () => new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        const emptyDaily = (date) => ({
            date,
            computer_revenues: 0,
            stationary_revenues: 0,
            photocopy_revenues: 0,
            air_ticket_revenues: 0,
            air_ticket_sell: 0,
            due_list: [],
            discount: [],
            others_revenues: [],
            expenses: [],
            summary: [],
            given_loan_list: [],
            taken_loan_list: [],
        });

        const normalizeProducts = (products = []) => {
            if (!Array.isArray(products)) return [];
            return products.map((product) => {
                const quantity = money(product?.quantity);
                const rate = money(product?.rate);
                return {
                    ...product,
                    product_name: String(product?.product_name || '').trim(),
                    quantity,
                    rate,
                    total: money(quantity * rate),
                    category: String(product?.category || '').trim(),
                };
            });
        };

        const categoryTotals = (products = []) => {
            const totals = { Computer: 0, Stationary: 0, Photocopy: 0, Others: 0 };
            for (const product of products) {
                if (DAILY_CATEGORIES.includes(product.category)) {
                    totals[product.category] = money(totals[product.category] + money(product.total));
                }
            }
            return totals;
        };

        const sumDueForDate = (dueList = [], targetDate) => {
            return (Array.isArray(dueList) ? dueList : []).reduce((sum, group) => {
                if (getDateOnly(group?.date) !== getDateOnly(targetDate)) return sum;
                return sum + (Array.isArray(group?.due_data)
                    ? group.due_data.reduce((s, item) => s + money(item?.amount), 0)
                    : 0);
            }, 0);
        };

        const ensureSummaryDate = (summary, date, daily) => {
            const target = getDateOnly(date);
            let index = summary.findIndex((item) => getDateOnly(item?.date) === target);

            if (index === -1) {
                summary.push({
                    date: target,
                    computer_revenues: money(daily.computer_revenues),
                    stationary_revenues: money(daily.stationary_revenues),
                    photocopy_revenues: money(daily.photocopy_revenues),
                    air_ticket_revenues: money(daily.air_ticket_revenues),
                    air_ticket_sell: money(daily.air_ticket_sell),
                    others_revenues: Array.isArray(daily.others_revenues) ? clone(daily.others_revenues) : [],
                    due: sumDueForDate(daily.due_list, target),
                    discount: Array.isArray(daily.discount)
                        ? clone(daily.discount).filter((item) => getDateOnly(item?.date) === target)
                        : [],
                    expenses: Array.isArray(daily.expenses) ? clone(daily.expenses) : [],
                });
                index = summary.length - 1;
            }

            return index;
        };

        const refreshSummaryDate = (summary, date, daily) => {
            const target = getDateOnly(date);
            const index = ensureSummaryDate(summary, target, daily);
            const current = summary[index] || {};

            summary[index] = {
                ...current,
                date: target,
                computer_revenues: money(daily.computer_revenues),
                stationary_revenues: money(daily.stationary_revenues),
                photocopy_revenues: money(daily.photocopy_revenues),
                air_ticket_revenues: money(daily.air_ticket_revenues),
                air_ticket_sell: money(daily.air_ticket_sell),
                others_revenues: Array.isArray(daily.others_revenues) ? clone(daily.others_revenues) : [],
                due: sumDueForDate(daily.due_list, target),
                discount: Array.isArray(daily.discount)
                    ? clone(daily.discount).filter((item) => getDateOnly(item?.date) === target)
                    : [],
                expenses: Array.isArray(daily.expenses) ? clone(daily.expenses) : [],
            };
        };

        /* =========================================================
           ENSURE CURRENT BUSINESS DAY
        ========================================================= */

        const ensureToday = async () => {
            const today = getTodayDateOnly();
            let daily = await dailyTransactionsCollection.findOne({});

            if (!daily) {
                const fresh = emptyDaily(today);
                const result = await dailyTransactionsCollection.insertOne(fresh);
                return { ...fresh, _id: result.insertedId };
            }

            if (getDateOnly(daily.date) === today) return daily;

            const oldDate = getDateOnly(daily.date);
            const summary = Array.isArray(daily.summary) ? clone(daily.summary) : [];

            const oldSnapshot = {
                date: oldDate,
                computer_revenues: money(daily.computer_revenues),
                stationary_revenues: money(daily.stationary_revenues),
                photocopy_revenues: money(daily.photocopy_revenues),
                air_ticket_revenues: money(daily.air_ticket_revenues),
                air_ticket_sell: money(daily.air_ticket_sell),
                others_revenues: Array.isArray(daily.others_revenues) ? clone(daily.others_revenues) : [],
                due: sumDueForDate(daily.due_list, oldDate),
                discount: Array.isArray(daily.discount)
                    ? clone(daily.discount).filter((item) => getDateOnly(item?.date) === oldDate)
                    : [],
                expenses: Array.isArray(daily.expenses) ? clone(daily.expenses) : [],
            };

            const oldIndex = summary.findIndex((item) => getDateOnly(item?.date) === oldDate);
            if (oldIndex >= 0) summary[oldIndex] = oldSnapshot;
            else summary.push(oldSnapshot);

            await dailyTransactionsCollection.updateOne(
                { _id: daily._id },
                {
                    $set: {
                        date: today,
                        computer_revenues: 0,
                        stationary_revenues: 0,
                        photocopy_revenues: 0,
                        air_ticket_revenues: 0,
                        air_ticket_sell: 0,
                        others_revenues: [],
                        expenses: [],
                        discount: [],
                        summary,
                        given_loan_list: Array.isArray(daily.given_loan_list) ? daily.given_loan_list : [],
                        taken_loan_list: Array.isArray(daily.taken_loan_list) ? daily.taken_loan_list : [],
                    },
                }
            );

            return dailyTransactionsCollection.findOne({ _id: daily._id });
        };


        /* =========================================================
   VOUCHER SERIAL
========================================================= */

        app.get('/voucher_sl', async (req, res) => {
            try {
                res.send(await voucherSlCollection.findOne({}) || { sl_no: 0 });
            } catch (error) {
                res.status(500).send({ error: 'Failed to load voucher serial', details: error.message });
            }
        });

        app.post('/voucher_sl', async (req, res) => {
            try {
                const slNo = money(req.body?.new_sl_no);
                const existing = await voucherSlCollection.findOne({});
                const result = existing
                    ? await voucherSlCollection.updateOne({ _id: existing._id }, { $set: { sl_no: slNo } })
                    : await voucherSlCollection.insertOne({ sl_no: slNo });
                res.send({ success: true, acknowledged: result.acknowledged, sl_no: slNo });
            } catch (error) {
                res.status(500).send({ error: 'Failed to update voucher serial', details: error.message });
            }
        });


        /* =========================================================
           DAILY READ
        ========================================================= */

        app.get('/daily_transactions/ensure_today', async (req, res) => {
            try {
                res.send(await ensureToday());
            } catch (error) {
                res.status(500).send({ error: 'Failed to load daily transactions', details: error.message });
            }
        });

        app.get('/daily_transactions', async (req, res) => {
            try {
                res.send(await ensureToday());
            } catch (error) {
                res.status(500).send({ error: 'Failed to load daily transactions', details: error.message });
            }
        });

        /* =========================================================
           MANUAL REVENUE
        ========================================================= */

        app.patch('/daily_transactions/revenue', async (req, res) => {
            try {
                const category = String(req.body?.category || '').toLowerCase();
                const amount = money(req.body?.amount);
                const discount = money(req.body?.discount);
                const paid = money(req.body?.paid_amount);
                const reference = String(req.body?.reference || '').trim();
                const comment = String(req.body?.comment || '').trim();
                const time = String(req.body?.time || '');

                if (!['computer', 'stationary', 'photocopy', 'others'].includes(category))
                    return res.status(400).send({ error: 'Invalid revenue category.' });
                if (amount <= 0) return res.status(400).send({ error: 'Invalid revenue amount.' });
                if (discount < 0 || discount > amount) return res.status(400).send({ error: 'Invalid discount.' });
                const due = money(Math.max(0, amount - discount - paid));
                if (paid < 0 || paid > money(amount - discount)) return res.status(400).send({ error: 'Invalid paid amount.' });
                if (due > 0 && !reference) return res.status(400).send({ error: 'Reference is required for a due entry.' });

                const daily = await ensureToday();
                const today = getDateOnly(daily.date);
                const dailyUpdate = clone(daily);
                const referenceText = reference || `Manual ${category}`;

                if (category === 'computer') dailyUpdate.computer_revenues = money(dailyUpdate.computer_revenues + amount);
                if (category === 'stationary') dailyUpdate.stationary_revenues = money(dailyUpdate.stationary_revenues + amount);
                if (category === 'photocopy') dailyUpdate.photocopy_revenues = money(dailyUpdate.photocopy_revenues + amount);
                if (category === 'others') {
                    if (!Array.isArray(dailyUpdate.others_revenues)) dailyUpdate.others_revenues = [];
                    dailyUpdate.others_revenues.push({ amount, comment, reference: referenceText });
                }
                if (discount > 0) dailyUpdate.discount.push({ date: today, reference: referenceText, amount: discount });
                if (due > 0) {
                    let group = dailyUpdate.due_list.find((item) => getDateOnly(item?.date) === today);
                    if (!group) { group = { date: today, due_data: [] }; dailyUpdate.due_list.push(group); }
                    group.due_data.push({ reference: referenceText, amount: due });
                }

                refreshSummaryDate(dailyUpdate.summary, today, dailyUpdate);

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    {
                        $set: {
                            computer_revenues: dailyUpdate.computer_revenues,
                            stationary_revenues: dailyUpdate.stationary_revenues,
                            photocopy_revenues: dailyUpdate.photocopy_revenues,
                            others_revenues: dailyUpdate.others_revenues,
                            due_list: dailyUpdate.due_list,
                            discount: dailyUpdate.discount,
                            summary: dailyUpdate.summary,
                            last_revenue_transaction: { category, amount, paid, comment, time },
                        }
                    }
                );

                res.send({ success: true, acknowledged: result.acknowledged, result });
            } catch (error) {
                res.status(500).send({ error: 'Revenue transaction failed', details: error.message });
            }
        });

        /* =========================================================
           EXPENSE
        ========================================================= */

        app.patch('/daily_transactions/expense', async (req, res) => {
            try {
                const amount = money(req.body?.amount);
                const comment = String(req.body?.comment || '').trim();
                const time = String(req.body?.time || '');
                if (amount <= 0) return res.status(400).send({ error: 'Expense amount must be greater than 0.' });
                if (!comment) return res.status(400).send({ error: 'Expense description is required.' });

                const daily = await ensureToday();
                const expenses = Array.isArray(daily.expenses) ? clone(daily.expenses) : [];
                expenses.push({ amount, comment });

                const summary = Array.isArray(daily.summary) ? clone(daily.summary) : [];
                const last_expense_transaction = { amount, comment, time };
                const dailyCopy = clone(daily);
                dailyCopy.expenses = expenses;
                refreshSummaryDate(summary, getDateOnly(daily.date), dailyCopy);

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    { $set: { expenses, summary, last_expense_transaction } }
                );
                res.send({ success: true, acknowledged: result.acknowledged, result });
            } catch (error) {
                res.status(500).send({ error: 'Expense transaction failed', details: error.message });
            }
        });

        /* =========================================================
           CREATE VOUCHER
        ========================================================= */

        app.put('/new_voucher/:id', async (req, res) => {
            try {
                const clientId = req.params.id;
                if (!ObjectId.isValid(clientId)) return res.status(400).send({ success: false, error: 'Invalid client id' });

                const products = normalizeProducts(req.body?.products);
                const invalid = products.find((p) => !p.product_name || p.quantity <= 0 || p.rate < 0 || !DAILY_CATEGORIES.includes(p.category));
                if (invalid) return res.status(400).send({ success: false, error: `Invalid product/category: ${invalid.product_name || 'Unknown product'}` });

                const total = money(products.reduce((sum, p) => sum + p.total, 0));
                const discount = money(req.body?.discount);
                const paid = money(req.body?.paid_amount);
                if (discount < 0 || discount > total) return res.status(400).send({ success: false, error: 'Invalid voucher discount.' });
                if (paid < 0 || paid > money(total - discount)) return res.status(400).send({ success: false, error: 'Invalid voucher paid amount.' });
                const due = money(total - discount - paid);

                const clientFilter = { _id: new ObjectId(clientId) };
                const client = await clientCornerCollection.findOne(clientFilter);
                if (!client) return res.status(404).send({ success: false, error: 'Client not found' });

                const voucherNo = String(req.body?.voucher_no || '').trim();
                if (!voucherNo) return res.status(400).send({ success: false, error: 'Voucher number is required' });

                const vouchers = Array.isArray(client.vouchers) ? clone(client.vouchers) : [];
                if (vouchers.some((v) => String(v?.voucher_no) === voucherNo))
                    return res.status(409).send({ success: false, error: `Voucher #${voucherNo} already exists for this client.` });

                const daily = await ensureToday();
                const today = getDateOnly(daily.date);
                const voucherDate = getDateOnly(req.body?.date) || today;
                if (voucherDate !== today)
                    return res.status(409).send({ success: false, error: 'Voucher date must be today.' });

                const voucher = {
                    ...req.body,
                    date: req.body?.date || `${today}, ${new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
                    voucher_no: voucherNo,
                    products,
                    total,
                    paid_amount: paid,
                    due_amount: due,
                    payment_status: due > 0 ? 'Unpaid' : 'Paid',
                    discount,
                };

                if (vouchers.length >= 10) vouchers.shift();
                vouchers.push(voucher);

                const transections = Array.isArray(client.transections) ? clone(client.transections) : [];
                if (paid > 0) {
                    if (transections.length >= 15) transections.shift();
                    transections.push({
                        date: voucher.date,
                        reference_voucher: voucherNo,
                        paid_amount: paid,
                        transection_amount: paid,
                        due_amount: due,
                        payment_status: voucher.payment_status,
                    });
                }

                const totals = categoryTotals(products);
                const nextDaily = clone(daily);
                nextDaily.computer_revenues = money(nextDaily.computer_revenues + totals.Computer);
                nextDaily.stationary_revenues = money(nextDaily.stationary_revenues + totals.Stationary);
                nextDaily.photocopy_revenues = money(nextDaily.photocopy_revenues + totals.Photocopy);

                const voucherReference = `Voucher no: ${voucherNo}`;
                if (!Array.isArray(nextDaily.others_revenues)) nextDaily.others_revenues = [];
                for (const product of products.filter((p) => p.category === 'Others')) {
                    nextDaily.others_revenues.push({ amount: money(product.total), comment: product.product_name, reference: voucherReference });
                }

                if (discount > 0) nextDaily.discount.push({ date: today, reference: voucherReference, amount: discount });
                if (due > 0) {
                    let group = nextDaily.due_list.find((g) => getDateOnly(g?.date) === today);
                    if (!group) { group = { date: today, due_data: [] }; nextDaily.due_list.push(group); }
                    group.due_data.push({ reference: voucherReference, amount: due });
                }

                refreshSummaryDate(nextDaily.summary, today, nextDaily);

                await clientCornerCollection.updateOne(clientFilter, { $set: { vouchers, transections } });
                const dailyResult = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    {
                        $set: {
                            computer_revenues: nextDaily.computer_revenues,
                            stationary_revenues: nextDaily.stationary_revenues,
                            photocopy_revenues: nextDaily.photocopy_revenues,
                            others_revenues: nextDaily.others_revenues,
                            due_list: nextDaily.due_list,
                            discount: nextDaily.discount,
                            summary: nextDaily.summary,
                        }
                    }
                );

                res.send({ success: true, acknowledged: dailyResult.acknowledged, voucher, categoryTotals: totals, dailyResult });
            } catch (error) {
                console.error('new_voucher error:', error);
                res.status(500).send({ success: false, error: 'Voucher creation failed', details: error.message });
            }
        });

        /* =========================================================
           EDIT VOUCHER — SAME DAY ONLY
        
           Historical vouchers are intentionally locked. This guarantees
           that a previous day's closed financial summary cannot be changed
           accidentally. Current-day edits use category DELTAS.
        ========================================================= */

        app.patch('/edit_voucher/:id', async (req, res) => {
            try {
                const clientId = req.params.id;
                if (!ObjectId.isValid(clientId)) return res.status(400).send({ success: false, error: 'Invalid client id' });

                const clientFilter = { _id: new ObjectId(clientId) };
                const client = await clientCornerCollection.findOne(clientFilter);
                if (!client) return res.status(404).send({ success: false, error: 'Client not found' });

                const voucherNo = String(req.body?.voucher_no || '').trim();
                const vouchers = Array.isArray(client.vouchers) ? clone(client.vouchers) : [];
                const voucherIndex = vouchers.findIndex((v) => String(v?.voucher_no) === voucherNo);
                if (voucherIndex < 0) return res.status(404).send({ success: false, error: 'Voucher not found' });

                const oldVoucher = vouchers[voucherIndex];
                const daily = await ensureToday();
                const today = getDateOnly(daily.date);
                const voucherDate = getDateOnly(oldVoucher.date);

                if (voucherDate !== today) {
                    return res.status(409).send({
                        success: false,
                        code: 'VOUCHER_EDIT_LOCKED',
                        error: 'This voucher belongs to a previous date and can no longer be edited.',
                    });
                }

                const newProducts = normalizeProducts(req.body?.products);
                const invalid = newProducts.find((p) => !p.product_name || p.quantity <= 0 || p.rate < 0 || !DAILY_CATEGORIES.includes(p.category));
                if (invalid) return res.status(400).send({ success: false, error: `Invalid product/category: ${invalid.product_name || 'Unknown product'}` });

                const oldProducts = normalizeProducts(oldVoucher.products);
                const oldTotals = categoryTotals(oldProducts);
                const newTotals = categoryTotals(newProducts);
                const total = money(newProducts.reduce((sum, p) => sum + p.total, 0));
                const paid = money(oldVoucher.paid_amount);
                const discount = money(oldVoucher.discount);
                const due = money(Math.max(0, total - paid - discount));

                const voucherReference = `Voucher no: ${voucherNo}`;
                const nextDaily = clone(daily);

                nextDaily.computer_revenues = money(nextDaily.computer_revenues + newTotals.Computer - oldTotals.Computer);
                nextDaily.stationary_revenues = money(nextDaily.stationary_revenues + newTotals.Stationary - oldTotals.Stationary);
                nextDaily.photocopy_revenues = money(nextDaily.photocopy_revenues + newTotals.Photocopy - oldTotals.Photocopy);

                nextDaily.others_revenues = (Array.isArray(nextDaily.others_revenues) ? nextDaily.others_revenues : [])
                    .filter((item) => item?.reference !== voucherReference);
                for (const product of newProducts.filter((p) => p.category === 'Others')) {
                    nextDaily.others_revenues.push({ amount: money(product.total), comment: product.product_name, reference: voucherReference });
                }

                // Replace this voucher's due entry only. Other vouchers are untouched.
                nextDaily.due_list = (Array.isArray(nextDaily.due_list) ? nextDaily.due_list : []).map((group) => ({
                    ...group,
                    due_data: Array.isArray(group?.due_data)
                        ? group.due_data.filter((item) => item?.reference !== voucherReference)
                        : [],
                })).filter((group) => Array.isArray(group.due_data) && group.due_data.length);

                if (due > 0) {
                    let group = nextDaily.due_list.find((g) => getDateOnly(g?.date) === today);
                    if (!group) { group = { date: today, due_data: [] }; nextDaily.due_list.push(group); }
                    group.due_data.push({ reference: voucherReference, amount: due });
                }

                const updatedVoucher = {
                    ...oldVoucher,
                    products: newProducts,
                    total,
                    due_amount: due,
                    payment_status: due > 0 ? 'Unpaid' : 'Paid',
                };

                vouchers[voucherIndex] = updatedVoucher;
                refreshSummaryDate(nextDaily.summary, today, nextDaily);

                const voucherResult = await clientCornerCollection.updateOne(
                    clientFilter,
                    { $set: { vouchers } }
                );

                const dailyResult = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    {
                        $set: {
                            computer_revenues: nextDaily.computer_revenues,
                            stationary_revenues: nextDaily.stationary_revenues,
                            photocopy_revenues: nextDaily.photocopy_revenues,
                            others_revenues: nextDaily.others_revenues,
                            due_list: nextDaily.due_list,
                            summary: nextDaily.summary,
                        }
                    }
                );

                res.send({
                    success: voucherResult.acknowledged && dailyResult.acknowledged,
                    voucher: updatedVoucher,
                    dailyResult,
                    changes: {
                        computerDelta: money(newTotals.Computer - oldTotals.Computer),
                        stationaryDelta: money(newTotals.Stationary - oldTotals.Stationary),
                        photocopyDelta: money(newTotals.Photocopy - oldTotals.Photocopy),
                        oldCategoryTotals: oldTotals,
                        newCategoryTotals: newTotals,
                    },
                });
            } catch (error) {
                console.error('edit_voucher error:', error);
                res.status(500).send({ success: false, error: 'Voucher edit failed', details: error.message });
            }
        });

        /* =========================================================
           TAKE PAYMENT / ADDITIONAL DISCOUNT
        
           Payment NEVER increases revenue again.
           It only reduces the matching due and records payment/discount.
        ========================================================= */

        app.put('/take_payment/:id', async (req, res) => {
            try {
                const clientId = req.params.id;
                if (!ObjectId.isValid(clientId)) return res.status(400).send({ success: false, error: 'Invalid client id' });

                const voucherNo = String(req.body?.voucher_no || '').trim();
                const clientFilter = { _id: new ObjectId(clientId) };
                const client = await clientCornerCollection.findOne(clientFilter);
                if (!client) return res.status(404).send({ success: false, error: 'Client not found' });

                const vouchers = Array.isArray(client.vouchers) ? clone(client.vouchers) : [];
                const voucherIndex = vouchers.findIndex((v) => String(v?.voucher_no) === voucherNo);
                if (voucherIndex < 0) return res.status(404).send({ success: false, error: 'Voucher not found' });

                const voucher = vouchers[voucherIndex];
                const currentDue = money(voucher.due_amount);
                const payment = money(req.body?.transection_amount);
                const extraDiscount = money(req.body?.additional_discount);
                const reduction = money(payment + extraDiscount);

                if (payment <= 0 && extraDiscount <= 0) return res.status(400).send({ success: false, error: 'Payment or additional discount is required.' });
                if (reduction > currentDue) return res.status(400).send({ success: false, error: 'Payment + discount cannot exceed current due.' });

                const daily = await ensureToday();
                const nextDaily = clone(daily);
                const dueReference = `Voucher no: ${voucherNo}`;
                let found = false;
                let dueDate = '';

                for (const group of nextDaily.due_list) {
                    if (!Array.isArray(group?.due_data)) continue;
                    const index = group.due_data.findIndex((item) => item?.reference === dueReference);
                    if (index < 0) continue;
                    found = true;
                    dueDate = getDateOnly(group.date);
                    const current = money(group.due_data[index].amount);
                    if (reduction > current) return res.status(400).send({ success: false, error: 'Daily due amount is smaller than requested reduction.' });
                    const remaining = money(current - reduction);
                    if (remaining <= 0) group.due_data.splice(index, 1);
                    else group.due_data[index].amount = remaining;
                    break;
                }

                if (!found) return res.status(404).send({ success: false, error: `Due entry not found for ${dueReference}.` });

                nextDaily.due_list = nextDaily.due_list.filter((g) => Array.isArray(g?.due_data) && g.due_data.length);

                if (extraDiscount > 0) {
                    nextDaily.discount.push({
                        date: getDateOnly(req.body?.date) || getTodayDateOnly(),
                        reference: dueReference,
                        amount: extraDiscount,
                    });
                }

                voucher.paid_amount = money(voucher.paid_amount + payment);
                voucher.discount = money(voucher.discount + extraDiscount);
                voucher.due_amount = money(currentDue - reduction);
                voucher.payment_status = voucher.due_amount > 0 ? 'Unpaid' : 'Paid';
                vouchers[voucherIndex] = voucher;

                const transections = Array.isArray(client.transections) ? clone(client.transections) : [];
                if (payment > 0) {
                    if (transections.length >= 15) transections.shift();
                    transections.push({
                        date: req.body?.date || getTodayDateOnly(),
                        reference_voucher: voucherNo,
                        paid_amount: payment,
                        transection_amount: payment,
                        due_amount: voucher.due_amount,
                        payment_status: voucher.payment_status,
                    });
                }

                // Update ONLY the due field of the voucher's original summary date.
                // Never overwrite historical category revenue with today's active totals.
                const summaryDateIndex = nextDaily.summary.findIndex(
                    (item) => getDateOnly(item?.date) === dueDate
                );
                if (summaryDateIndex >= 0) {
                    nextDaily.summary[summaryDateIndex].due = sumDueForDate(
                        nextDaily.due_list,
                        dueDate
                    );
                }

                // If the payment/extra discount happened today and today's summary
                // already exists, refresh today's summary so its discount/due values stay current.
                if (dueDate === getTodayDateOnly()) {
                    refreshSummaryDate(nextDaily.summary, dueDate, nextDaily);
                }

                const voucherResult = await clientCornerCollection.updateOne(
                    clientFilter,
                    { $set: { vouchers, transections } }
                );

                const dailyResult = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    {
                        $set: {
                            due_list: nextDaily.due_list,
                            discount: nextDaily.discount,
                            summary: nextDaily.summary,
                        }
                    }
                );

                res.send({ success: voucherResult.acknowledged && dailyResult.acknowledged, voucher, dailyResult });
            } catch (error) {
                console.error('take_payment error:', error);
                res.status(500).send({ success: false, error: 'Payment update failed', details: error.message });
            }
        });

        /* =========================================================
           PAY A GENERIC DUE
        ========================================================= */

        app.patch('/daily_transactions/pay_due', async (req, res) => {
            try {
                const date = getDateOnly(req.body?.date);
                const reference = String(req.body?.reference || '').trim();
                const amount = money(req.body?.paid_amount ?? req.body?.amount);
                if (!date || !reference || amount <= 0) return res.status(400).send({ error: 'Date, reference and valid payment amount are required.' });

                const daily = await ensureToday();
                const nextDaily = clone(daily);
                const group = nextDaily.due_list.find((g) => getDateOnly(g?.date) === date);
                if (!group) return res.status(404).send({ error: 'Due date not found.' });
                const index = group.due_data.findIndex((item) => String(item?.reference || '').trim() === reference);
                if (index < 0) return res.status(404).send({ error: 'Due entry not found.' });

                const current = money(group.due_data[index].amount);
                if (amount > current) return res.status(400).send({ error: `Payment cannot exceed current due of ${current}.` });
                const remaining = money(current - amount);
                if (remaining <= 0) group.due_data.splice(index, 1);
                else group.due_data[index].amount = remaining;
                nextDaily.due_list = nextDaily.due_list.filter((g) => Array.isArray(g?.due_data) && g.due_data.length);
                refreshSummaryDate(nextDaily.summary, date, nextDaily);

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    { $set: { due_list: nextDaily.due_list, summary: nextDaily.summary } }
                );
                res.send({ success: true, acknowledged: result.acknowledged, remaining_due: remaining, result });
            } catch (error) {
                res.status(500).send({ error: 'Due payment failed', details: error.message });
            }
        });

        /* =========================================================
           DELETE SUMMARY DATE RANGE
        ========================================================= */

        /* =========================================================
           STAFF TRANSACTION -> DAILY EXPENSE

           Every "Make a Transaction" from StaffDetails is treated as
           today's expense. Existing staff accounting remains unchanged.
        ========================================================= */

        app.put('/transection_details/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) return res.status(400).send({ acknowledged: false, error: 'Invalid staff id' });

                const body = req.body || {};
                const amount = money(body.transection_amount);
                const type = String(body.transection_type || '').trim();
                const currentDate = getDateOnly(body.currentDate) || getTodayDateOnly();
                if (amount <= 0) return res.status(400).send({ acknowledged: false, error: 'Transaction amount must be greater than 0.' });
                if (!type) return res.status(400).send({ acknowledged: false, error: 'Transaction type is required.' });

                const staffFilter = { _id: new ObjectId(id) };
                const staff = await staffsCollection.findOne(staffFilter);
                if (!staff) return res.status(404).send({ acknowledged: false, error: 'Staff not found.' });

                // Preserve the existing staff balance/transaction behavior.
                const previousWithdrawal = money(body.previous_withdrawal_amount ?? staff.withdrawal_amount);
                const previousAvailable = money(body.previous_available_balance ?? staff.available_balance);
                const newWithdrawal = type === 'Payback Lend'
                    ? money(previousWithdrawal - amount)
                    : money(body.withdrawal_amount ?? previousWithdrawal + amount);
                const newAvailable = type === 'Payback Lend'
                    ? money(previousAvailable + amount)
                    : money(body.available_balance ?? previousAvailable - amount);

                const staffTransaction = {
                    transection_id: String(body.transection_id || `${Date.now()}-${id}`),
                    transection_date: currentDate,
                    transection_amount: amount,
                    transection_type: type,
                    comment: String(body.comment || '').trim(),
                };

                const staffTransactions = Array.isArray(staff.transections) ? clone(staff.transections) : [];
                if (staffTransactions.length >= 20) staffTransactions.shift();
                staffTransactions.push(staffTransaction);

                const staffResult = await staffsCollection.updateOne(
                    staffFilter,
                    { $set: { withdrawal_amount: newWithdrawal, available_balance: newAvailable, transections: staffTransactions } }
                );
                if (!staffResult.acknowledged) throw new Error('Staff transaction update failed');

                // Only current-day staff transactions belong to the active daily account.
                const daily = await ensureToday();
                const today = getDateOnly(daily.date);
                if (currentDate !== today) {
                    return res.send({ acknowledged: true, staffResult, dailySynced: false });
                }

                const expenses = Array.isArray(daily.expenses) ? clone(daily.expenses) : [];
                expenses.push({
                    amount,
                    comment: `${currentDate} ${staff.name || 'Staff'} ${type}`,
                });

                const nextDaily = clone(daily);
                nextDaily.expenses = expenses;
                refreshSummaryDate(nextDaily.summary, today, nextDaily);

                const dailyResult = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    { $set: { expenses: nextDaily.expenses, summary: nextDaily.summary } }
                );

                res.send({ acknowledged: staffResult.acknowledged && dailyResult.acknowledged, staffResult, dailyResult });
            } catch (error) {
                console.error('transection_details error:', error);
                res.status(500).send({ acknowledged: false, error: 'Staff transaction update failed', details: error.message });
            }
        });

        /* =========================================================
           LOAN MANAGEMENT

           Loans live on the main daily_transactions document and are
           intentionally preserved across business-day rollover/closing.
        ========================================================= */

        app.get('/daily_transactions/loans', async (req, res) => {
            try {
                const daily = await ensureToday();
                res.send({
                    success: true,
                    given_loan_list: Array.isArray(daily.given_loan_list) ? daily.given_loan_list : [],
                    taken_loan_list: Array.isArray(daily.taken_loan_list) ? daily.taken_loan_list : [],
                });
            } catch (error) {
                console.error('loan list error:', error);
                res.status(500).send({ success: false, error: 'Failed to load loan lists.', details: error.message });
            }
        });

        app.post('/daily_transactions/loan', async (req, res) => {
            try {
                const type = String(req.body?.type || '').trim();
                const name = String(req.body?.name || '').trim();
                const amount = money(req.body?.amount);
                const date = getDateOnly(req.body?.date);

                if (!['Given Loan', 'Taken Loan'].includes(type)) {
                    return res.status(400).send({ success: false, error: 'Loan type must be Given Loan or Taken Loan.' });
                }
                if (!name) return res.status(400).send({ success: false, error: 'Person name is required.' });
                if (amount <= 0) return res.status(400).send({ success: false, error: 'Loan amount must be greater than 0.' });
                if (!date) return res.status(400).send({ success: false, error: 'Loan date is required.' });

                const daily = await ensureToday();
                const loan = {
                    date,
                    name,
                    amount,
                    payback_transactions: [],
                };
                const field = type === 'Given Loan' ? 'given_loan_list' : 'taken_loan_list';

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    { $push: { [field]: loan } }
                );

                if (!result.acknowledged) {
                    return res.status(500).send({ success: false, error: 'Loan could not be saved.' });
                }

                const updated = await dailyTransactionsCollection.findOne({ _id: daily._id });
                res.send({
                    success: true,
                    acknowledged: result.acknowledged,
                    loan,
                    given_loan_list: updated.given_loan_list || [],
                    taken_loan_list: updated.taken_loan_list || [],
                });
            } catch (error) {
                console.error('loan create error:', error);
                res.status(500).send({ success: false, error: 'Loan creation failed.', details: error.message });
            }
        });

        app.patch('/daily_transactions/loan/payback', async (req, res) => {
            try {
                const type = String(req.body?.type || '').trim();
                const loanIndex = Number(req.body?.loanIndex);
                const amount = money(req.body?.amount);
                const paybackDate = getTodayDateOnly();

                if (!['Given Loan', 'Taken Loan'].includes(type)) {
                    return res.status(400).send({ success: false, error: 'Invalid loan type.' });
                }
                if (!Number.isInteger(loanIndex) || loanIndex < 0) {
                    return res.status(400).send({ success: false, error: 'Invalid loan selection.' });
                }
                if (amount <= 0) {
                    return res.status(400).send({ success: false, error: 'Payback amount must be greater than 0.' });
                }

                const daily = await ensureToday();
                const field = type === 'Given Loan' ? 'given_loan_list' : 'taken_loan_list';
                const loans = Array.isArray(daily[field]) ? clone(daily[field]) : [];
                const loan = loans[loanIndex];

                if (!loan) return res.status(404).send({ success: false, error: 'Loan not found.' });

                const originalAmount = money(loan.amount);
                const paidAlready = Array.isArray(loan.payback_transactions)
                    ? money(loan.payback_transactions.reduce((sum, item) => sum + money(item?.amount), 0))
                    : 0;
                const currentDue = money(originalAmount - paidAlready);

                if (currentDue <= 0) {
                    loans.splice(loanIndex, 1);
                    await dailyTransactionsCollection.updateOne({ _id: daily._id }, { $set: { [field]: loans } });
                    return res.status(409).send({ success: false, error: 'This loan is already fully paid.' });
                }

                if (amount > currentDue) {
                    return res.status(400).send({ success: false, error: `Payback cannot exceed current due of ${currentDue}.` });
                }

                if (!Array.isArray(loan.payback_transactions)) loan.payback_transactions = [];
                loan.payback_transactions.push({ date: paybackDate, amount });

                const remainingDue = money(currentDue - amount);
                if (remainingDue <= 0) {
                    loans.splice(loanIndex, 1);
                }

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    { $set: { [field]: loans } }
                );

                if (!result.acknowledged) {
                    return res.status(500).send({ success: false, error: 'Loan payback could not be saved.' });
                }

                const updated = await dailyTransactionsCollection.findOne({ _id: daily._id });
                res.send({
                    success: true,
                    acknowledged: result.acknowledged,
                    remaining_due: remainingDue,
                    removed: remainingDue <= 0,
                    given_loan_list: updated.given_loan_list || [],
                    taken_loan_list: updated.taken_loan_list || [],
                });
            } catch (error) {
                console.error('loan payback error:', error);
                res.status(500).send({ success: false, error: 'Loan payback failed.', details: error.message });
            }
        });

        /* =========================================================
           CLOSING ACCOUNT
        ========================================================= */

        app.patch('/daily_transactions/close_account', async (req, res) => {
            try {
                const daily = await ensureToday();
                const closingDate = getDateOnly(daily.date);
                const closingSummary = Array.isArray(daily.closing_summary)
                    ? clone(daily.closing_summary)
                    : [];

                const computer = money(daily.computer_revenues);
                const stationary = money(daily.stationary_revenues);
                const photocopy = money(daily.photocopy_revenues);
                const airTicket = money(daily.air_ticket_revenues);
                const airTicketSell = money(daily.air_ticket_sell);
                const others = Array.isArray(daily.others_revenues)
                    ? money(daily.others_revenues.reduce((sum, item) => sum + money(item?.amount), 0))
                    : 0;
                const discount = Array.isArray(daily.discount)
                    ? money(daily.discount.reduce((sum, item) => sum + money(item?.amount), 0))
                    : 0;
                const expenses = Array.isArray(daily.expenses)
                    ? money(daily.expenses.reduce((sum, item) => sum + money(item?.amount), 0))
                    : 0;
                const due = money(sumDueForDate(daily.due_list, closingDate));

                const previousClosing = closingSummary.length
                    ? money(closingSummary[closingSummary.length - 1]?.available_balance)
                    : 0;

                const grossRevenue = money(
                    computer + stationary + photocopy + airTicket + others
                );

                const availableBalance = money(
                    previousClosing + grossRevenue - discount - expenses - due
                );

                const closingEntry = {
                    closing_date: closingDate,
                    computer_revenues: computer,
                    stationary_revenues: stationary,
                    photocopy_revenues: photocopy,
                    air_ticket_revenues: airTicket,
                    air_ticket_sell: airTicketSell,
                    others_revenues: others,
                    due,
                    discount,
                    expenses,
                    previous_closing_balance: previousClosing,
                    available_balance: availableBalance,
                };

                closingSummary.push(closingEntry);

                const result = await dailyTransactionsCollection.updateOne(
                    { _id: daily._id },
                    {
                        $set: {
                            computer_revenues: 0,
                            stationary_revenues: 0,
                            photocopy_revenues: 0,
                            air_ticket_revenues: 0,
                            air_ticket_sell: 0,
                            others_revenues: [],
                            expenses: [],
                            discount: [],
                            summary: [],
                            closing_summary: closingSummary,
                        },
                    }
                );

                res.send({
                    success: result.acknowledged,
                    closing_summary: closingEntry,
                    dailyResult: result,
                });
            } catch (error) {
                console.error('close_account error:', error);
                res.status(500).send({
                    success: false,
                    error: 'Account closing failed',
                    details: error.message,
                });
            }
        });

        app.patch('/daily_transactions/delete_summary', async (req, res) => {
            try {
                const { startDate, endDate } = req.body || {};
                if (!startDate || !endDate) return res.status(400).send({ error: 'Start and end date are required.' });
                const start = new Date(`${startDate}T00:00:00`);
                const end = new Date(`${endDate}T23:59:59`);
                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
                    return res.status(400).send({ error: 'Invalid date range.' });

                const daily = await dailyTransactionsCollection.findOne({});
                if (!daily) return res.status(404).send({ error: 'Daily transaction document not found.' });

                const summary = (daily.summary || []).filter((item) => {
                    const date = new Date(getDateOnly(item?.date));
                    return !(date >= start && date <= end);
                });
                const result = await dailyTransactionsCollection.updateOne({ _id: daily._id }, { $set: { summary } });
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Delete failed', details: error.message });
            }
        });

        // ============================================================================================================ End =================================================

        /* =========================================================
           DAILY TRANSACTION READ
        ========================================================= */

        app.get('/daily_transactions', async (req, res) => {
            try {
                const result = await ensureToday();
                res.send(result);
            } catch (error) {
                res.status(500).send({
                    error: 'Failed to load daily transactions',
                    details: error.message,
                });
            }
        });



        const VOUCHER_EDIT_DAILY_CATEGORIES = [
            'Computer',
            'Stationary',
            'Photocopy',
            'Others',
        ];

        /* =========================================================
           MONEY
        ========================================================= */

        const voucherEditMoney = (value) => {
            const number = Number(value);

            if (!Number.isFinite(number)) {
                return 0;
            }

            return Number(number.toFixed(2));
        };

        /* =========================================================
           CLONE
        ========================================================= */

        const voucherEditClone = (value) => {
            return JSON.parse(
                JSON.stringify(value)
            );
        };

        /* =========================================================
           DATE ONLY
        ========================================================= */

        const voucherEditGetDateOnly = (value) => {
            if (!value) {
                return '';
            }

            const text = String(value).trim();

            /*
                Example:
        
                August 15, 2026, 12:34 AM
        
                becomes:
        
                August 15, 2026
            */

            const fullDateMatch = text.match(
                /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/
            );

            if (fullDateMatch) {
                return `${fullDateMatch[1]} ${fullDateMatch[2]}, ${fullDateMatch[3]}`;
            }

            /*
                Handle:
        
                September 1
        
                September 1, 2026
            */

            const shortDateMatch = text.match(
                /^([A-Za-z]+)\s+(\d{1,2})/
            );

            if (shortDateMatch) {
                return `${shortDateMatch[1]} ${shortDateMatch[2]}`;
            }

            return text;
        };

        /* =========================================================
           DATE NORMALIZER
        ========================================================= */

        const voucherEditNormalizeDate = (
            value,
            fallbackYear = new Date().getFullYear()
        ) => {
            const dateOnly =
                voucherEditGetDateOnly(value);

            if (!dateOnly) {
                return '';
            }

            const fullMatch = dateOnly.match(
                /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/
            );

            if (fullMatch) {
                return `${fullMatch[1]} ${fullMatch[2]}, ${fullMatch[3]}`;
            }

            const shortMatch = dateOnly.match(
                /^([A-Za-z]+)\s+(\d{1,2})$/
            );

            if (shortMatch) {
                return `${shortMatch[1]} ${shortMatch[2]}, ${fallbackYear}`;
            }

            return dateOnly;
        };

        /* =========================================================
           TODAY DATE
        ========================================================= */

        const voucherEditTodayDateOnly = () => {
            return new Date().toLocaleDateString(
                'en-US',
                {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                }
            );
        };

        /* =========================================================
           SAME DATE CHECK
        ========================================================= */

        const voucherEditIsSameDate = (
            date1,
            date2
        ) => {
            const normalizedDate1 =
                voucherEditNormalizeDate(date1);

            const normalizedDate2 =
                voucherEditNormalizeDate(date2);

            return (
                normalizedDate1 ===
                normalizedDate2
            );
        };

        /* =========================================================
           NORMALIZE PRODUCTS
        ========================================================= */

        const voucherEditNormalizeProducts = (
            products
        ) => {
            if (!Array.isArray(products)) {
                return [];
            }

            return products.map((product) => {
                const quantity = Number(
                    product?.quantity || 0
                );

                const rate = Number(
                    product?.rate || 0
                );

                const total =
                    voucherEditMoney(
                        quantity * rate
                    );

                return {
                    ...product,

                    product_name:
                        String(
                            product?.product_name ||
                            ''
                        ).trim(),

                    quantity,

                    rate,

                    total,

                    category:
                        String(
                            product?.category ||
                            ''
                        ).trim(),
                };
            });
        };

        /* =========================================================
           CATEGORY TOTALS
        ========================================================= */

        const voucherEditCategoryTotals = (
            products
        ) => {
            const totals = {
                Computer: 0,
                Stationary: 0,
                Photocopy: 0,
                Others: 0,
            };

            for (const product of products) {
                const category =
                    product?.category;

                if (
                    VOUCHER_EDIT_DAILY_CATEGORIES.includes(
                        category
                    )
                ) {
                    totals[category] +=
                        voucherEditMoney(
                            product?.total
                        );
                }
            }

            return {
                Computer:
                    voucherEditMoney(
                        totals.Computer
                    ),

                Stationary:
                    voucherEditMoney(
                        totals.Stationary
                    ),

                Photocopy:
                    voucherEditMoney(
                        totals.Photocopy
                    ),

                Others:
                    voucherEditMoney(
                        totals.Others
                    ),
            };
        };

        /* =========================================================
           DUE SUM FOR DATE
        ========================================================= */

        const voucherEditSumDueForDate = (
            dueList,
            targetDate
        ) => {
            if (!Array.isArray(dueList)) {
                return 0;
            }

            const target =
                voucherEditNormalizeDate(
                    targetDate
                );

            let total = 0;

            for (const group of dueList) {
                const groupDate =
                    voucherEditNormalizeDate(
                        group?.date
                    );

                if (groupDate !== target) {
                    continue;
                }

                if (
                    !Array.isArray(
                        group?.due_data
                    )
                ) {
                    continue;
                }

                for (const item of group.due_data) {
                    total +=
                        voucherEditMoney(
                            item?.amount
                        );
                }
            }

            return voucherEditMoney(total);
        };



        app.put('/hour_rate/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const bodyData = req.body;

                const result = await staffsCollection.updateOne(filter, {
                    $set: {
                        hour_rate: bodyData.hour_rate
                    }
                });

                res.send(result);
            } catch (err) {
                console.error('hour_rate error:', err);
                res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });


        app.put('/payback_loan/:id', async (req, res) => {
            try {
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
            } catch (err) {
                console.error('payback_loan error:', err);
                res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });


        app.get('/products', async (req, res) => {
            try {
                const result = await productsCollection.find().toArray();
                res.send(result);
            } catch (err) {
                console.error('products GET error:', err);
                res.status(500).send({
                    error: 'Failed to fetch products',
                    details: err.message
                });
            }
        });


        app.post('/products', async (req, res) => {
            try {
                const product = req.body;

                const result = await productsCollection.insertOne(product);

                res.send(result);
            } catch (err) {
                console.error('products POST error:', err);
                res.status(500).send({
                    error: 'Failed to add product',
                    details: err.message
                });
            }
        });


        app.delete('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const product = req.body;
                const filter = { _id: new ObjectId(id) };

                const result = await productsCollection.deleteOne(filter);

                res.send(result);
            } catch (err) {
                console.error('products DELETE error:', err);
                res.status(500).send({
                    error: 'Failed to delete product',
                    details: err.message
                });
            }
        });


        app.put('/replace_staff/:id', async (req, res) => {
            try {
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
            } catch (err) {
                console.error('replace_staff error:', err);
                res.status(500).send({
                    error: 'Update failed',
                    details: err.message
                });
            }
        });


        app.put('/change_time/:id', async (req, res) => {
            try {
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
            } catch (err) {
                console.error('change_time error:', err);
                res.status(500).send({
                    error: 'Time update failed',
                    details: err.message
                });
            }
        });


        app.put('/clear_bonus', async (req, res) => {
            try {
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
            } catch (err) {
                console.error('clear_bonus error:', err);
                res.status(500).send({
                    error: 'Bonus clear failed',
                    details: err.message
                });
            }
        });


        app.patch('/staff/remove_attendance/:id', async (req, res) => {
            const { id } = req.params;
            const { dateToRemove } = req.body;

            try {
                const staff = await staffsCollection.findOne({
                    _id: new ObjectId(id)
                });

                if (!staff) {
                    return res.status(404).send({
                        message: 'Staff not found'
                    });
                }

                const oldDetails = staff.current_month_details || [];

                const dayToDelete = oldDetails.find(
                    item => item.current_date === dateToRemove
                );

                if (!dayToDelete) {
                    return res.status(404).send({
                        message: 'Date not found'
                    });
                }

                let total_income = 0;
                let bonus = 0;
                let available_balance = 0;
                let total_working_hour = 0;
                let total_working_minute = 0;

                const previousTotalWorkingMinute =
                    (staff.total_working_hour * 60) +
                    staff.total_working_minute;

                const deletedTotalWorkingMinute =
                    (dayToDelete.total_hour * 60) +
                    dayToDelete.total_minute;

                const updatedTotalWorkingMinute =
                    previousTotalWorkingMinute -
                    deletedTotalWorkingMinute;

                total_income = parseFloat(
                    (staff.total_income - dayToDelete.total_earn).toFixed(2)
                );

                bonus =
                    staff.bonus -
                    dayToDelete.today_bonus;

                available_balance = parseFloat(
                    (staff.available_balance - dayToDelete.total_earn).toFixed(2)
                );

                total_working_hour =
                    Math.floor(updatedTotalWorkingMinute / 60);

                total_working_minute =
                    updatedTotalWorkingMinute % 60;

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
                            current_month_details: {
                                current_date: dateToRemove
                            }
                        }
                    }
                );

                res.send(result);
            } catch (err) {
                console.error('remove_attendance error:', err);

                res.status(500).send({
                    message: '❌ Server error',
                    error: err.message
                });
            }
        });





        app.patch('/edit_client_data/:id', async (req, res) => {
            const { id } = req.params;
            const {
                name,
                on_behalf,
                address,
                mobile_no
            } = req.body;

            try {
                const filter = {
                    _id: new ObjectId(id)
                };

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
                console.error('edit_client_data error:', err);

                res.status(500).send({
                    message: '❌ Server error',
                    error: err.message
                });
            }
        });


        app.patch('/air_ticket_edit_client_data/:id', async (req, res) => {
            const { id } = req.params;
            const {
                name,
                address,
                mobile_no
            } = req.body;

            try {
                const filter = {
                    _id: new ObjectId(id)
                };

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
                console.error('air_ticket_edit_client_data error:', err);

                res.status(500).send({
                    message: '❌ Server error',
                    error: err.message
                });
            }
        });





        /* =========================================================
   AIR TICKET CLIENT / VOUCHER APIs
   NOTE:
   - Uses the existing daily-transaction helpers already present
     in index.js: money(), clone(), getDateOnly(), ensureToday().
   - Air-ticket sales are recorded under Daily Transactions -> Others.
   - Existing route names are preserved.
   - Replace the old Air Ticket route block with this block only.
========================================================= */

        /* =========================================================
           AIR TICKET DAILY TRANSACTION SYSTEM

           Air-ticket revenue is:
           SUM(Ticket Price - Ticket Agent Price) - Voucher Discount.

           Customer due is based on:
           SUM(Ticket Price) - Voucher Discount - Paid Amount.

           Payment itself never increases revenue.
        ========================================================= */

        const AIR_TICKET_DAILY_REFERENCE = (voucherNo) =>
            `Air Ticket Voucher no: ${String(voucherNo)}`;

        const normalizeAirServices = (value) => {
            let services = Array.isArray(value?.services)
                ? value.services
                : [];

            // Backward compatibility with old single-ticket documents.
            if (
                !services.length &&
                (
                    value?.ticket_price !== undefined ||
                    value?.destination !== undefined
                )
            ) {
                services = [
                    {
                        service_name: 'Air Ticket',
                        destination: value?.destination || '',
                        flight_date: value?.flight_date || '',
                        ticket_price: value?.ticket_price || 0,
                        ticket_agent_price:
                            value?.ticket_agent_price ??
                            value?.agent_price ??
                            0,
                    },
                ];
            }

            return services.map((service) => ({
                ...service,

                service_name: String(
                    service?.service_name || 'Air Ticket'
                ).trim(),

                destination: String(
                    service?.destination || ''
                ).trim(),

                flight_date: service?.flight_date || '',

                ticket_price: money(
                    service?.ticket_price
                ),

                ticket_agent_price: money(
                    service?.ticket_agent_price ??
                    service?.agent_price ??
                    0
                ),
            }));
        };

        const airTicketTotals = (voucher) => {
            const services = normalizeAirServices(voucher);

            const ticketPrice = money(
                services.reduce(
                    (sum, service) =>
                        sum + money(service.ticket_price),
                    0
                )
            );

            const agentPrice = money(
                services.reduce(
                    (sum, service) =>
                        sum + money(service.ticket_agent_price),
                    0
                )
            );

            const discount = money(
                voucher?.discount
            );

            const paid = money(
                voucher?.paid_amount
            );

            /*
             * IMPORTANT:
             *
             * Customer Due
             * = Ticket Price - Discount - Paid
             *
             * Business Revenue
             * = Ticket Price - Agent Price - Discount
             *
             * Air Ticket Sell
             * = Ticket Price - Discount
             */

            const revenue = money(
                Math.max(
                    0,
                    ticketPrice -
                    agentPrice -
                    discount
                )
            );

            const due = money(
                Math.max(
                    0,
                    ticketPrice -
                    discount -
                    paid
                )
            );

            return {
                services,
                ticketPrice,
                agentPrice,
                discount,
                paid,
                revenue,
                due,
            };
        };

        const airTicketSummaryRow = (
            summary,
            date
        ) => {
            const target = getDateOnly(date);

            let index = summary.findIndex(
                (item) =>
                    getDateOnly(item?.date) === target
            );

            if (index === -1) {
                summary.push({
                    date: target,

                    computer_revenues: 0,

                    stationary_revenues: 0,

                    photocopy_revenues: 0,

                    air_ticket_revenues: 0,

                    /*
                     * Total Air Ticket selling amount
                     * after discount.
                     */
                    air_ticket_sell: 0,

                    others_revenues: [],

                    due: 0,

                    discount: [],

                    expenses: [],
                });

                index = summary.length - 1;
            }

            return {
                row: summary[index],
                index,
                target,
            };
        };


        /*
         * ============================================================
         * AIR TICKET DAILY TRANSACTION SYNC
         * ============================================================
         *
         * Air-ticket voucher create/edit/payment-এর সময়
         * এই helper:
         *
         * 1. air_ticket_revenues update করবে
         * 2. air_ticket_sell update করবে
         * 3. due_list update করবে
         * 4. discount update করবে
         * 5. summary update করবে
         *
         * Air Ticket Sell:
         *     ticket_price - discount
         *
         * Air Ticket Revenue:
         *     ticket_price - agent_price - discount
         *
         * Customer Due:
         *     ticket_price - discount - paid
         *
         * Discount revenue থেকে আলাদা থাকবে।
         */

        const syncAirTicketDaily = async ({
            daily,
            oldVoucher = null,
            newVoucher = null,
            sellDeltaOverride = null,
        }) => {
            const currentDaily = clone(daily);

            const today = getDateOnly(
                currentDaily.date
            );

            const oldTotals = oldVoucher
                ? airTicketTotals(oldVoucher)
                : {
                    ticketPrice: 0,
                    agentPrice: 0,
                    discount: 0,
                    paid: 0,
                    revenue: 0,
                    due: 0,
                };

            const newTotals = newVoucher
                ? airTicketTotals(newVoucher)
                : {
                    ticketPrice: 0,
                    agentPrice: 0,
                    discount: 0,
                    paid: 0,
                    revenue: 0,
                    due: 0,
                };

            const voucherDate = getDateOnly(
                newVoucher?.transaction_date ||
                newVoucher?.date ||
                oldVoucher?.transaction_date ||
                oldVoucher?.date
            );

            const voucherNo =
                newVoucher?.voucher_no ??
                oldVoucher?.voucher_no;

            const reference =
                AIR_TICKET_DAILY_REFERENCE(
                    voucherNo
                );

            /*
             * Prepare current daily transaction.
             */
            const next = {
                ...currentDaily,

                air_ticket_revenues: money(
                    currentDaily.air_ticket_revenues
                ),

                air_ticket_sell: money(
                    currentDaily.air_ticket_sell
                ),

                due_list: Array.isArray(
                    currentDaily.due_list
                )
                    ? clone(currentDaily.due_list)
                    : [],

                discount: Array.isArray(
                    currentDaily.discount
                )
                    ? clone(currentDaily.discount)
                    : [],

                summary: Array.isArray(
                    currentDaily.summary
                )
                    ? clone(currentDaily.summary)
                    : [],
            };


            /*
             * =========================================================
             * REVENUE DELTA
             * =========================================================
             *
             * Example:
             *
             * Old revenue = 2,000
             * New revenue = 3,000
             *
             * Delta = +1,000
             */
            const revenueDelta = money(
                newTotals.revenue -
                oldTotals.revenue
            );


            /*
             * =========================================================
             * AIR TICKET SELL DELTA
             * =========================================================
             *
             * Air Ticket Sell = Ticket Price - Discount
             *
             * Example:
             *
             * Old ticket price = 10,000
             * Old discount     = 200
             * Old sell         = 9,800
             *
             * New ticket price = 15,000
             * New discount     = 500
             * New sell         = 14,500
             *
             * Delta = +4,700
             */
            const sellDelta = sellDeltaOverride !== null
                ? money(sellDeltaOverride)
                : money(
                    (
                        newTotals.ticketPrice -
                        newTotals.discount
                    ) -
                    (
                        oldTotals.ticketPrice -
                        oldTotals.discount
                    )
                );


            /*
             * =========================================================
             * UPDATE CURRENT DAY
             * =========================================================
             */
            if (voucherDate === today) {
                next.air_ticket_revenues =
                    money(
                        next.air_ticket_revenues +
                        revenueDelta
                    );

                next.air_ticket_sell =
                    money(
                        next.air_ticket_sell +
                        sellDelta
                    );
            }


            /*
             * =========================================================
             * REMOVE OLD DUE
             * =========================================================
             *
             * Same voucher edit/payment-এর সময় duplicate due
             * তৈরি হবে না।
             */
            next.due_list = next.due_list
                .map((group) => ({
                    ...group,

                    due_data: Array.isArray(
                        group?.due_data
                    )
                        ? group.due_data.filter(
                            (item) =>
                                String(
                                    item?.reference || ''
                                ) !== reference
                        )
                        : [],
                }))
                .filter(
                    (group) =>
                        Array.isArray(
                            group?.due_data
                        ) &&
                        group.due_data.length
                );


            /*
             * =========================================================
             * ADD NEW DUE
             * =========================================================
             */
            if (
                newVoucher &&
                newTotals.due > 0
            ) {
                let group =
                    next.due_list.find(
                        (item) =>
                            getDateOnly(
                                item?.date
                            ) === voucherDate
                    );

                if (!group) {
                    group = {
                        date: voucherDate,
                        due_data: [],
                    };

                    next.due_list.push(group);
                }

                group.due_data.push({
                    reference,
                    amount: newTotals.due,
                });
            }


            /*
             * =========================================================
             * REMOVE OLD DISCOUNT
             * =========================================================
             *
             * Discount revenue-এর ভিতরে যাবে না।
             */
            next.discount =
                next.discount.filter(
                    (item) =>
                        String(
                            item?.reference || ''
                        ) !== reference
                );


            /*
             * =========================================================
             * ADD NEW DISCOUNT
             * =========================================================
             */
            if (
                newVoucher &&
                newTotals.discount > 0
            ) {
                next.discount.push({
                    date: voucherDate,

                    reference,

                    amount:
                        newTotals.discount,
                });
            }


            /*
             * =========================================================
             * UPDATE SUMMARY
             * =========================================================
             */
            const summaryInfo =
                airTicketSummaryRow(
                    next.summary,
                    voucherDate
                );

            const existingRow =
                summaryInfo.row || {};

            const existingAirRevenue =
                money(
                    existingRow.air_ticket_revenues
                );

            const existingAirTicketSell =
                money(
                    existingRow.air_ticket_sell
                );

            let summaryAirRevenue;

            let summaryAirTicketSell;


            /*
             * Today's summary should exactly match
             * today's current transaction values.
             */
            if (voucherDate === today) {
                summaryAirRevenue =
                    next.air_ticket_revenues;

                summaryAirTicketSell =
                    next.air_ticket_sell;
            } else {
                /*
                 * Historical date হলে delta দিয়ে update হবে।
                 */
                summaryAirRevenue =
                    money(
                        existingAirRevenue +
                        revenueDelta
                    );

                summaryAirTicketSell =
                    money(
                        existingAirTicketSell +
                        sellDelta
                    );
            }


            /*
             * Save summary row.
             */
            next.summary[
                summaryInfo.index
            ] = {
                ...existingRow,

                date:
                    summaryInfo.target,

                /*
                 * Business profit/revenue.
                 */
                air_ticket_revenues:
                    summaryAirRevenue,

                /*
                 * Total Air Ticket Sale
                 * after discount.
                 */
                air_ticket_sell:
                    summaryAirTicketSell,

                /*
                 * Total due for this date.
                 */
                due:
                    sumDueForDate(
                        next.due_list,
                        summaryInfo.target
                    ),

                /*
                 * Discount list for this date.
                 */
                discount:
                    next.discount.filter(
                        (item) =>
                            getDateOnly(
                                item?.date
                            ) ===
                            summaryInfo.target
                    ),
            };


            /*
             * =========================================================
             * UPDATE MONGODB
             * =========================================================
             */
            const result =
                await dailyTransactionsCollection.updateOne(
                    {
                        _id: daily._id,
                    },
                    {
                        $set: {
                            air_ticket_revenues:
                                next.air_ticket_revenues,

                            /*
                             * IMPORTANT:
                             * Ticket Price - Discount goes here.
                             */
                            air_ticket_sell:
                                next.air_ticket_sell,

                            due_list:
                                next.due_list,

                            discount:
                                next.discount,

                            summary:
                                next.summary,
                        },
                    }
                );


            if (!result.acknowledged) {
                throw new Error(
                    'Daily Transactions update was not acknowledged.'
                );
            }

            return {
                daily: next,
                result,
            };
        };


        /* =========================================================
           AIR TICKET CLIENT CORNER
        ========================================================= */


        /*
         * =========================================================
         * GET ALL AIR TICKET CLIENTS
         * =========================================================
         */
        app.get(
            '/air_ticket_client_corner',
            async (req, res) => {
                try {
                    const result =
                        await airTicketClientCornerCollection
                            .find()
                            .toArray();

                    res.send(result);
                } catch (err) {
                    console.error(
                        'air_ticket_client_corner error:',
                        err
                    );

                    res.status(500).send({
                        error:
                            'Internal server error',

                        details:
                            err.message,
                    });
                }
            }
        );


        /*
         * =========================================================
         * GET AIR TICKET CLIENT DETAILS
         * =========================================================
         */
        app.get(
            '/air_ticket_client_details/:id',
            async (req, res) => {
                try {
                    const id = req.params.id;

                    if (
                        !ObjectId.isValid(id)
                    ) {
                        return res.status(400).send({
                            error:
                                'Invalid client id',
                        });
                    }

                    const result =
                        await airTicketClientCornerCollection.findOne(
                            {
                                _id:
                                    new ObjectId(id),
                            }
                        );

                    if (!result) {
                        return res.status(404).send({
                            error:
                                'Client not found',
                        });
                    }

                    res.send(result);
                } catch (err) {
                    res.status(500).send({
                        error:
                            'Internal server error',

                        details:
                            err.message,
                    });
                }
            }
        );


        /*
         * =========================================================
         * DELETE AIR TICKET CLIENT
         * =========================================================
         */
        app.delete(
            '/air_ticket_client/:id',
            async (req, res) => {
                try {
                    const id = req.params.id;

                    if (
                        !ObjectId.isValid(id)
                    ) {
                        return res.status(400).send({
                            error:
                                'Invalid client id',
                        });
                    }

                    const result =
                        await airTicketClientCornerCollection.deleteOne(
                            {
                                _id:
                                    new ObjectId(id),
                            }
                        );

                    res.send(result);
                } catch (err) {
                    res.status(500).send({
                        error:
                            'Internal server error',

                        details:
                            err.message,
                    });
                }
            }
        );


        /*
         * =========================================================
         * CREATE NEW AIR TICKET CLIENT
         * =========================================================
         */
        app.post(
            '/air_ticket_new_client',
            async (req, res) => {
                try {
                    const data =
                        req.body || {};

                    const voucherInput =
                        Array.isArray(
                            data.vouchers
                        )
                            ? data.vouchers[0]
                            : null;


                    if (
                        !data.name ||
                        !voucherInput
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Client name and voucher are required',
                        });
                    }


                    /*
                     * Get today's Daily Transaction.
                     */
                    const daily =
                        await ensureToday();

                    const today =
                        getDateOnly(
                            daily.date
                        );


                    const voucherDate =
                        getDateOnly(
                            voucherInput.date
                        ) || today;


                    /*
                     * Only today's voucher is allowed.
                     */
                    if (
                        voucherDate !== today
                    ) {
                        return res.status(409).send({
                            success: false,

                            error:
                                'Voucher date must be today.',
                        });
                    }


                    /*
                     * Calculate Air Ticket totals.
                     */
                    const totals =
                        airTicketTotals(
                            voucherInput
                        );


                    if (
                        !totals.services.length
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'At least one service is required',
                        });
                    }


                    /*
                     * Validate service prices.
                     */
                    if (
                        totals.services.some(
                            (service) =>
                                service.ticket_price <= 0 ||
                                service.ticket_agent_price < 0
                        )
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid service price',
                        });
                    }


                    /*
                     * Validate discount.
                     */
                    if (
                        totals.discount < 0 ||
                        totals.discount >
                        totals.ticketPrice
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid discount',
                        });
                    }


                    /*
                     * Validate paid amount.
                     */
                    if (
                        totals.paid < 0 ||
                        totals.paid >
                        money(
                            totals.ticketPrice -
                            totals.discount
                        )
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid paid amount',
                        });
                    }


                    /*
                     * Create normalized voucher.
                     */
                    const voucher = {
                        ...voucherInput,

                        date:
                            voucherInput.date ||
                            `${today}, ${new Date().toLocaleTimeString(
                                'en-BD',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                }
                            )}`,

                        voucher_no:
                            String(
                                voucherInput.voucher_no
                            ),

                        services:
                            totals.services,

                        /*
                         * Total Ticket Price.
                         */
                        ticket_price:
                            totals.ticketPrice,

                        /*
                         * Total Agent Price.
                         */
                        ticket_agent_price:
                            totals.agentPrice,

                        /*
                         * Paid amount.
                         */
                        paid_amount:
                            totals.paid,

                        /*
                         * Discount.
                         */
                        discount:
                            totals.discount,

                        /*
                         * Customer due.
                         */
                        due_amount:
                            totals.due,

                        payment_status:
                            totals.due > 0
                                ? 'Unpaid'
                                : 'Paid',
                    };


                    /*
                     * Create client document.
                     */
                    const clientData = {
                        ...data,

                        vouchers: [
                            voucher,
                        ],
                    };


                    const result =
                        await airTicketClientCornerCollection.insertOne(
                            clientData
                        );


                    if (
                        !result.acknowledged
                    ) {
                        return res.status(500).send({
                            success: false,

                            error:
                                'Client creation failed',
                        });
                    }


                    /*
                     * IMPORTANT:
                     *
                     * Here:
                     *
                     * air_ticket_sell =
                     * ticket_price - discount
                     *
                     * Example:
                     *
                     * ticket_price = 10000
                     * agent_price  = 7500
                     * discount     = 200
                     *
                     * air_ticket_sell     = 9800
                     * air_ticket_revenues = 2300
                     */
                    const dailySync =
                        await syncAirTicketDaily({
                            daily,

                            newVoucher:
                                voucher,
                        });


                    const dailyResult =
                        dailySync.result;


                    res.send({
                        success: true,

                        acknowledged: true,

                        client_id:
                            result.insertedId,

                        voucher,

                        dailyResult,
                    });
                } catch (err) {
                    console.error(
                        'air_ticket_new_client error:',
                        err
                    );

                    res.status(500).send({
                        success: false,

                        error:
                            'Insert failed',

                        details:
                            err.message,
                    });
                }
            }
        );


        /*
         * =========================================================
         * ADD NEW AIR TICKET VOUCHER TO EXISTING CLIENT
         * =========================================================
         */
        app.put(
            '/air_ticket_new_voucher/:id',
            async (req, res) => {
                try {
                    const id =
                        req.params.id;


                    /*
                     * Validate client ID.
                     */
                    if (
                        !ObjectId.isValid(id)
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid client id',
                        });
                    }


                    const clientFilter = {
                        _id:
                            new ObjectId(id),
                    };


                    /*
                     * Find client.
                     */
                    const client =
                        await airTicketClientCornerCollection.findOne(
                            clientFilter
                        );


                    if (!client) {
                        return res.status(404).send({
                            success: false,

                            error:
                                'Client not found',
                        });
                    }


                    const data =
                        req.body || {};


                    /*
                     * Get today's Daily Transaction.
                     */
                    const daily =
                        await ensureToday();

                    const today =
                        getDateOnly(
                            daily.date
                        );


                    /*
                     * Only today's voucher is allowed.
                     */
                    if (
                        getDateOnly(
                            data.date
                        ) !== today
                    ) {
                        return res.status(409).send({
                            success: false,

                            error:
                                'Voucher date must be today.',
                        });
                    }


                    /*
                     * Validate voucher number.
                     */
                    const voucherNo =
                        String(
                            data.voucher_no || ''
                        ).trim();


                    if (!voucherNo) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Voucher number is required',
                        });
                    }


                    /*
                     * Prevent duplicate voucher number
                     * for same client.
                     */
                    if (
                        (client.vouchers || [])
                            .some(
                                (v) =>
                                    String(
                                        v?.voucher_no
                                    ) === voucherNo
                            )
                    ) {
                        return res.status(409).send({
                            success: false,

                            error:
                                'Voucher number already exists for this client.',
                        });
                    }


                    /*
                     * Calculate totals.
                     */
                    const totals =
                        airTicketTotals(
                            data
                        );


                    if (
                        !totals.services.length
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'At least one service is required',
                        });
                    }


                    /*
                     * Validate service prices.
                     */
                    if (
                        totals.services.some(
                            (service) =>
                                service.ticket_price <= 0 ||
                                service.ticket_agent_price < 0
                        )
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid service price',
                        });
                    }


                    /*
                     * Validate discount.
                     */
                    if (
                        totals.discount < 0 ||
                        totals.discount >
                        totals.ticketPrice
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid discount',
                        });
                    }


                    /*
                     * Validate paid amount.
                     */
                    if (
                        totals.paid < 0 ||
                        totals.paid >
                        money(
                            totals.ticketPrice -
                            totals.discount
                        )
                    ) {
                        return res.status(400).send({
                            success: false,

                            error:
                                'Invalid paid amount',
                        });
                    }


                    /*
                     * Create normalized voucher.
                     */
                    const voucher = {
                        ...data,

                        date:
                            data.date,

                        voucher_no:
                            voucherNo,

                        services:
                            totals.services,

                        ticket_price:
                            totals.ticketPrice,

                        ticket_agent_price:
                            totals.agentPrice,

                        paid_amount:
                            totals.paid,

                        discount:
                            totals.discount,

                        due_amount:
                            totals.due,

                        payment_status:
                            totals.due > 0
                                ? 'Unpaid'
                                : 'Paid',
                    };


                    /*
                     * Existing vouchers.
                     */
                    const vouchers =
                        Array.isArray(
                            client.vouchers
                        )
                            ? clone(
                                client.vouchers
                            )
                            : [];


                    /*
                     * Keep maximum 10 vouchers.
                     */
                    if (
                        vouchers.length >= 10
                    ) {
                        vouchers.shift();
                    }


                    vouchers.push(
                        voucher
                    );


                    /*
                     * Existing transactions.
                     */
                    const transections =
                        Array.isArray(
                            client.transections
                        )
                            ? clone(
                                client.transections
                            )
                            : [];


                    /*
                     * Save payment transaction
                     * when paid amount > 0.
                     */
                    if (
                        totals.paid > 0
                    ) {
                        if (
                            transections.length >=
                            15
                        ) {
                            transections.shift();
                        }

                        transections.push({
                            date:
                                voucher.date,

                            reference_voucher:
                                voucherNo,

                            paid_amount:
                                totals.paid,

                            transection_amount:
                                totals.paid,

                            due_amount:
                                totals.due,

                            payment_status:
                                voucher.payment_status,
                        });
                    }


                    /*
                     * IMPORTANT:
                     *
                     * syncAirTicketDaily() will update:
                     *
                     * daily.air_ticket_sell
                     *
                     * with:
                     *
                     * ticket_price - discount
                     */
                    const dailySync =
                        await syncAirTicketDaily({
                            daily,

                            newVoucher:
                                voucher,
                        });


                    /*
                     * Update client.
                     */
                    const clientResult =
                        await airTicketClientCornerCollection.updateOne(
                            clientFilter,

                            {
                                $set: {
                                    vouchers,

                                    transections,
                                },
                            }
                        );


                    const dailyResult =
                        dailySync.result;


                    res.send({
                        success:
                            clientResult.acknowledged &&
                            dailyResult.acknowledged,

                        acknowledged:
                            clientResult.acknowledged,

                        voucher,

                        dailyResult,
                    });
                } catch (err) {
                    console.error(
                        'air_ticket_new_voucher error:',
                        err
                    );

                    res.status(500).send({
                        success: false,

                        error:
                            'Voucher creation failed',

                        details:
                            err.message,
                    });
                }
            }
        );

        // app.put('/air_ticket_take_payment/:id', async (req, res) => {
        //     try {
        //         const id = req.params.id;
        //         if (!ObjectId.isValid(id)) return res.status(400).send({ success: false, error: 'Invalid client id' });
        //         const clientFilter = { _id: new ObjectId(id) };
        //         const client = await airTicketClientCornerCollection.findOne(clientFilter);
        //         if (!client) return res.status(404).send({ success: false, error: 'Client not found' });

        //         const voucherNo = String(req.body?.voucher_no || '');
        //         const voucherIndex = (client.vouchers || []).findIndex(v => String(v?.voucher_no) === voucherNo);
        //         if (voucherIndex < 0) return res.status(404).send({ success: false, error: 'Voucher not found' });

        //         const oldVoucher = clone(client.vouchers[voucherIndex]);
        //         const oldTotals = airTicketTotals(oldVoucher);
        //         const payment = money(req.body?.transection_amount);
        //         const additionalDiscount = money(req.body?.additional_discount ?? req.body?.more_discount ?? 0);
        //         if (payment <= 0 && additionalDiscount <= 0) return res.status(400).send({ success: false, error: 'Payment or additional discount is required' });
        //         if (payment + additionalDiscount > oldTotals.due) return res.status(400).send({ success: false, error: 'Payment plus discount cannot exceed current due' });

        //         const updatedVoucher = {
        //             ...oldVoucher,
        //             paid_amount: money(oldTotals.paid + payment),
        //             discount: money(oldTotals.discount + additionalDiscount),
        //         };
        //         const newTotals = airTicketTotals(updatedVoucher);
        //         updatedVoucher.ticket_price = newTotals.ticketPrice;
        //         updatedVoucher.ticket_agent_price = newTotals.agentPrice;
        //         updatedVoucher.due_amount = newTotals.due;
        //         updatedVoucher.payment_status = newTotals.due > 0 ? 'Unpaid' : 'Paid';

        //         const vouchers = clone(client.vouchers);
        //         vouchers[voucherIndex] = updatedVoucher;
        //         const transections = Array.isArray(client.transections) ? clone(client.transections) : [];
        //         if (payment > 0) {
        //             if (transections.length >= 15) transections.shift();
        //             transections.push({
        //                 date: req.body?.date || getTodayDateOnly(),
        //                 reference_voucher: voucherNo,
        //                 paid_amount: updatedVoucher.paid_amount,
        //                 transection_amount: payment,
        //                 due_amount: updatedVoucher.due_amount,
        //                 payment_status: updatedVoucher.payment_status,
        //             });
        //         }

        //         const daily = await ensureToday();
        //         const dailySync = await syncAirTicketDaily({
        //             daily,
        //             oldVoucher,
        //             newVoucher: updatedVoucher,
        //             sellDeltaOverride: -additionalDiscount,
        //         });
        //         const clientResult = await airTicketClientCornerCollection.updateOne(clientFilter, { $set: { vouchers, transections } });
        //         const dailyResult = dailySync.result;

        //         res.send({ success: clientResult.acknowledged && dailyResult.acknowledged, voucher: updatedVoucher, dailyResult });
        //     } catch (err) {
        //         console.error('air_ticket_take_payment error:', err);
        //         res.status(500).send({ success: false, error: 'Payment update failed', details: err.message });
        //     }
        // });

        app.put('/air_ticket_take_payment/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const data = req.body || {};

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        error: 'Invalid client id'
                    });
                }

                const clientFilter = { _id: new ObjectId(id) };
                const client = await airTicketClientCornerCollection.findOne(
                    clientFilter
                );

                if (!client) {
                    return res.status(404).send({
                        success: false,
                        error: 'Client not found'
                    });
                }

                const voucherNo = String(data.voucher_no);
                const voucherIndex = (client.vouchers || []).findIndex(
                    voucher => String(voucher?.voucher_no) === voucherNo
                );

                if (voucherIndex === -1) {
                    return res.status(404).send({
                        success: false,
                        error: 'Voucher not found'
                    });
                }

                const oldVoucher = clone(client.vouchers[voucherIndex]);
                const currentDue = money(oldVoucher.due_amount);
                const currentPaid = money(oldVoucher.paid_amount);
                const currentDiscount = money(oldVoucher.discount);

                const payment = money(data.transection_amount);
                const additionalDiscount = money(
                    data.additional_discount ?? data.more_discount ?? 0
                );

                if (payment <= 0 && additionalDiscount <= 0) {
                    return res.status(400).send({
                        success: false,
                        error: 'Payment or additional discount is required'
                    });
                }

                if (payment + additionalDiscount > currentDue) {
                    return res.status(400).send({
                        success: false,
                        error: 'Payment plus discount cannot exceed current due'
                    });
                }

                const newPaid = money(currentPaid + payment);
                const newDiscount = money(
                    currentDiscount + additionalDiscount
                );
                const newDue = money(
                    Math.max(0, currentDue - payment - additionalDiscount)
                );
                const newStatus = newDue > 0 ? 'Unpaid' : 'Paid';

                const updatedVoucher = {
                    ...oldVoucher,
                    paid_amount: newPaid,
                    discount: newDiscount,
                    due_amount: newDue,
                    payment_status: newStatus
                };

                const vouchers = clone(client.vouchers);
                vouchers[voucherIndex] = updatedVoucher;

                const transaction = {
                    date:
                        data.date ||
                        new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
                    reference_voucher: voucherNo,
                    paid_amount: newPaid,
                    transection_amount: payment,
                    due_amount: newDue,
                    payment_status: newStatus
                };

                let transections = Array.isArray(client.transections)
                    ? clone(client.transections)
                    : [];

                if (transections.length > 15) {
                    transections.shift();
                }

                transections.push(transaction);

                const clientResult = await airTicketClientCornerCollection.updateOne(
                    clientFilter,
                    {
                        $set: {
                            vouchers,
                            transections
                        }
                    }
                );

                if (!clientResult.acknowledged) {
                    throw new Error('Air ticket client update failed');
                }

                const daily = await ensureToday();
                const updatedDaily = await updateAirTicketDailySummary({
                    daily,
                    voucher: updatedVoucher,
                    oldTicketPrice: oldVoucher.ticket_price,
                    oldDiscount: oldVoucher.discount,
                    oldDue: oldVoucher.due_amount
                });

                const dailyResult = await saveAirTicketDaily(updatedDaily);

                res.send({
                    success: true,
                    voucher: updatedVoucher,
                    dailyResult
                });
            } catch (err) {
                console.error('air_ticket_take_payment error:', err);
                res.status(500).send({
                    success: false,
                    error: 'Payment update failed',
                    details: err.message
                });
            }
        });

        app.patch('/air_ticket_edit_voucher/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) return res.status(400).send({ success: false, error: 'Invalid client id' });
                const clientFilter = { _id: new ObjectId(id) };
                const client = await airTicketClientCornerCollection.findOne(clientFilter);
                if (!client) return res.status(404).send({ success: false, error: 'Client not found' });

                const voucherNo = String(req.body?.voucher_no || '').trim();
                const vouchers = Array.isArray(client.vouchers) ? clone(client.vouchers) : [];
                const voucherIndex = vouchers.findIndex(v => String(v?.voucher_no) === voucherNo);
                if (voucherIndex < 0) return res.status(404).send({ success: false, error: 'Voucher not found' });

                const oldVoucher = vouchers[voucherIndex];
                const daily = await ensureToday();
                const today = getDateOnly(daily.date);
                if (getDateOnly(oldVoucher.date) !== today) {
                    return res.status(409).send({ success: false, code: 'VOUCHER_EDIT_LOCKED', error: 'This voucher can only be edited on the date it was created.' });
                }

                const merged = {
                    ...oldVoucher,
                    ...req.body,
                    voucher_no: voucherNo,
                    date: oldVoucher.date,
                    paid_amount: oldVoucher.paid_amount,
                    discount: req.body?.discount !== undefined ? req.body.discount : oldVoucher.discount,
                };
                const totals = airTicketTotals(merged);
                if (!totals.services.length) return res.status(400).send({ success: false, error: 'At least one service is required' });
                if (totals.services.some(service => service.ticket_price <= 0 || service.ticket_agent_price < 0)) return res.status(400).send({ success: false, error: 'Invalid service price' });
                if (totals.discount + totals.paid > totals.ticketPrice) return res.status(400).send({ success: false, error: 'Discount plus paid amount cannot exceed ticket price' });

                const updatedVoucher = {
                    ...oldVoucher,
                    services: totals.services,
                    ticket_price: totals.ticketPrice,
                    ticket_agent_price: totals.agentPrice,
                    discount: totals.discount,
                    paid_amount: totals.paid,
                    due_amount: totals.due,
                    payment_status: totals.due > 0 ? 'Unpaid' : 'Paid',
                };

                vouchers[voucherIndex] = updatedVoucher;
                const dailySync = await syncAirTicketDaily({ daily, oldVoucher, newVoucher: updatedVoucher });
                const clientResult = await airTicketClientCornerCollection.updateOne(clientFilter, { $set: { vouchers } });
                const dailyResult = dailySync.result;

                res.send({
                    success: clientResult.acknowledged && dailyResult.acknowledged,
                    voucher: updatedVoucher,
                    dailyResult,
                    changes: {
                        revenue_delta: money(airTicketTotals(updatedVoucher).revenue - airTicketTotals(oldVoucher).revenue),
                        due_delta: money(updatedVoucher.due_amount - money(oldVoucher.due_amount)),
                        discount_delta: money(updatedVoucher.discount - money(oldVoucher.discount)),
                    },
                });
            } catch (err) {
                console.error('air_ticket_edit_voucher error:', err);
                res.status(500).send({ success: false, error: 'Air ticket voucher edit failed', details: err.message });
            }
        });






        // ============================================      ============================================
        // ==============================================   ==============================================
        // ===============================================================================================


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