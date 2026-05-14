import "dotenv/config";
import pool from "./pool";

const demoTrainerIds = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
];

const demoAppointmentIds = [
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
  "77777777-7777-4777-8777-777777777777",
  "88888888-8888-4888-8888-888888888888",
];
const demoTraineeIds = [
  "99999999-9999-4999-8999-999999999999",
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
];

const demoTrainers = [
  {
    id: demoTrainerIds[0],
    name: "Dana Levi",
    phone: "0507000001",
    email: "dana.demo@queue.local",
    birthDate: "1988-02-10",
  },
  {
    id: demoTrainerIds[1],
    name: "Noam Cohen",
    phone: "0507000002",
    email: "noam.demo@queue.local",
    birthDate: "1985-09-22",
  },
];

const demoAppointments = [
  {
    id: demoAppointmentIds[0],
    customerName: "Yossi Cohen",
    phone: "0501234567",
    traineeId: demoTraineeIds[0],
    trainerId: demoTrainerIds[0],
    startsAt: "2026-05-15T17:00:00+03:00",
    endsAt: "2026-05-15T17:30:00+03:00",
    status: "scheduled",
    notes: "Demo seed: scheduled evening appointment",
  },
  {
    id: demoAppointmentIds[1],
    customerName: "Yossi Cohen",
    phone: "0501234567",
    traineeId: demoTraineeIds[0],
    trainerId: demoTrainerIds[0],
    startsAt: "2026-05-16T10:00:00+03:00",
    endsAt: "2026-05-16T10:30:00+03:00",
    status: "scheduled",
    notes: "Demo seed: second scheduled appointment for cancellation flow",
  },
  {
    id: demoAppointmentIds[2],
    customerName: "Maya Israeli",
    phone: "0509876543",
    traineeId: demoTraineeIds[2],
    trainerId: demoTrainerIds[0],
    startsAt: "2026-05-15T12:00:00+03:00",
    endsAt: "2026-05-15T12:30:00+03:00",
    status: "cancelled",
    notes: "Demo seed: cancelled appointment",
  },
  {
    id: demoAppointmentIds[3],
    customerName: "Amit Bar",
    phone: "0502223333",
    traineeId: demoTraineeIds[3],
    trainerId: demoTrainerIds[1],
    startsAt: "2026-05-15T10:30:00+03:00",
    endsAt: "2026-05-15T11:00:00+03:00",
    status: "scheduled",
    notes: "Demo seed: scheduled trainer two appointment",
  },
  {
    id: demoAppointmentIds[4],
    customerName: "Lior Tal",
    phone: "0504445555",
    traineeId: demoTraineeIds[4],
    trainerId: demoTrainerIds[1],
    startsAt: "2026-05-15T18:00:00+03:00",
    endsAt: "2026-05-15T18:30:00+03:00",
    status: "scheduled",
    notes: "Demo seed: trainer two evening appointment",
  },
  {
    id: demoAppointmentIds[5],
    customerName: "Roni Shalev",
    phone: "0506667777",
    traineeId: demoTraineeIds[5],
    trainerId: demoTrainerIds[1],
    startsAt: "2026-05-16T13:00:00+03:00",
    endsAt: "2026-05-16T13:30:00+03:00",
    status: "cancelled",
    notes: "Demo seed: cancelled trainer two appointment",
  },
];

const demoTrainees = [
  {
    id: demoTraineeIds[0],
    name: "Yossi Cohen",
    phone: "0501234567",
    email: "yossi.demo@queue.local",
    birthDate: "1994-04-12",
    trainerId: demoTrainerIds[0],
    isActive: true,
    notes: "Demo seed: assigned to Dana",
  },
  {
    id: demoTraineeIds[1],
    name: "Shira Demo",
    phone: "0505551212",
    email: "shira.demo@queue.local",
    birthDate: "1998-08-20",
    trainerId: null,
    isActive: true,
    notes: "Demo seed: no trainer assigned",
  },
  {
    id: demoTraineeIds[2],
    name: "Maya Israeli",
    phone: "0509876543",
    email: "maya.demo@queue.local",
    birthDate: "1991-11-03",
    trainerId: demoTrainerIds[0],
    isActive: true,
    notes: "Demo seed: assigned to Dana",
  },
  {
    id: demoTraineeIds[3],
    name: "Amit Bar",
    phone: "0502223333",
    email: "amit.demo@queue.local",
    birthDate: "1990-03-17",
    trainerId: demoTrainerIds[1],
    isActive: true,
    notes: "Demo seed: assigned to Noam",
  },
  {
    id: demoTraineeIds[4],
    name: "Lior Tal",
    phone: "0504445555",
    email: "lior.demo@queue.local",
    birthDate: "1996-07-08",
    trainerId: demoTrainerIds[1],
    isActive: true,
    notes: "Demo seed: assigned to Noam",
  },
  {
    id: demoTraineeIds[5],
    name: "Roni Shalev",
    phone: "0506667777",
    email: "roni.demo@queue.local",
    birthDate: "1992-12-24",
    trainerId: demoTrainerIds[1],
    isActive: true,
    notes: "Demo seed: assigned to Noam",
  },
];

const clearDemoData = async () => {
  await pool.query(
    `DELETE FROM queue.appointments
     WHERE id = ANY($1::uuid[])
        OR trainer_id = ANY($2::uuid[])
        OR trainee_id = ANY($3::uuid[])
        OR notes LIKE 'Demo seed:%'`,
    [demoAppointmentIds, demoTrainerIds, demoTraineeIds]
  );

  await pool.query(
    `DELETE FROM queue.trainer_working_hours
     WHERE trainer_id = ANY($1::uuid[])`,
    [demoTrainerIds]
  );

  await pool.query(
    `DELETE FROM queue.trainees
     WHERE id = ANY($1::uuid[])
        OR notes LIKE 'Demo seed:%'`,
    [demoTraineeIds]
  );

  await pool.query(
    `DELETE FROM queue.trainers
     WHERE id = ANY($1::uuid[])
        OR email LIKE '%.demo@queue.local'`,
    [demoTrainerIds]
  );
};

const seedTrainers = async () => {
  for (const trainer of demoTrainers) {
    await pool.query(
      `INSERT INTO queue.trainers (id, name, phone, email, birth_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           birth_date = EXCLUDED.birth_date,
           updated_at = now()`,
      [trainer.id, trainer.name, trainer.phone, trainer.email, trainer.birthDate]
    );
  }
};

const seedWorkingHours = async () => {
  for (const trainerId of demoTrainerIds) {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
      const isSecondTrainer = trainerId === demoTrainerIds[1];

      await pool.query(
        `INSERT INTO queue.trainer_working_hours
           (trainer_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [
          trainerId,
          dayOfWeek,
          isSecondTrainer ? "10:00" : "09:00",
          isSecondTrainer ? "20:00" : "18:00",
        ]
      );
    }
  }
};

const seedAppointments = async () => {
  for (const appointment of demoAppointments) {
    await pool.query(
      `INSERT INTO queue.appointments
         (id, trainee_id, customer_name, phone, trainer_id, starts_at, ends_at, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        appointment.id,
        appointment.traineeId,
        appointment.customerName,
        appointment.phone,
        appointment.trainerId,
        appointment.startsAt,
        appointment.endsAt,
        appointment.status,
        appointment.notes,
      ]
    );
  }
};

const seedTrainees = async () => {
  for (const trainee of demoTrainees) {
    await pool.query(
      `INSERT INTO queue.trainees
         (id, trainer_id, name, phone, email, birth_date, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (phone) DO UPDATE
       SET trainer_id = EXCLUDED.trainer_id,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           birth_date = EXCLUDED.birth_date,
           notes = EXCLUDED.notes,
           is_active = EXCLUDED.is_active,
           updated_at = now()`,
      [
        trainee.id,
        trainee.trainerId,
        trainee.name,
        trainee.phone,
        trainee.email,
        trainee.birthDate,
        trainee.notes,
        trainee.isActive,
      ]
    );
  }
};

const seed = async () => {
  await clearDemoData();
  await seedTrainers();
  await seedWorkingHours();
  await seedTrainees();
  await seedAppointments();
};

seed()
  .then(async () => {
    console.log("Demo seed completed.");
    console.log(`Trainer 1: ${demoTrainerIds[0]}`);
    console.log(`Trainer 2: ${demoTrainerIds[1]}`);
    console.log("Demo availability date: 2026-05-15");
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Demo seed failed:", error);
    await pool.end();
    process.exit(1);
  });
