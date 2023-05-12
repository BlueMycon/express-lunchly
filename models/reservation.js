"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests;
    this.startAt;
    this.notes = notes;

    this.setNumGuests(numGuests);
    this.setStartAt(startAt);
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
        [this.customerId, this.startAt, this.getNumGuests(), this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
               SET start_at=$1,
                  num_guests=$2,
                  notes=$3
               WHERE id = $4`,
        [this.startAt, this.getNumGuests(), this.notes, this.id]
      );
    }
  }

  /** Get number of guest for reservation */
  getNumGuests() {
    return this.numGuests;
  }

  /** Validates number of guest is greater than 0 */
  setNumGuests(num) {
    if (num < 1) {
      throw new BadRequestError("Number of guests must be 1 or more.");
    }
    this.numGuests = num;
  }

  /** Validates start date */
  setStartAt(startAt) {
    let startDate = new Date(startAt);

    if (startDate.toString() === 'Invalid Date') {
      throw new BadRequestError("Not a valid date");
    }

    this.startAt = startDate;
  }

}

module.exports = Reservation;
