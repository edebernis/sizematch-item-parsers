#!/usr/bin/env node

'use strict';

var amqp = require('amqplib');


class Consumer {
    constructor(hostname, port, username, password, vhost, heartbeat, queueName, prefetchCount) {
        this.hostname = hostname;
        this.port = port;
        this.username = username;
        this.password = password;
        this.vhost = vhost;
        this.heartbeat = heartbeat;
        this.queueName = queueName;
        this.prefetchCount = prefetchCount;

        this.connection = null;
        this.channel = null;
    }

    async connect() {
        this.connection = await amqp.connect({
            protocol: 'amqp',
            hostname: this.hostname,
            port: this.port,
            username: this.username,
            password: this.password,
            vhost: this.vhost,
            heartbeat: this.heartbeat
        });

        this.channel = await this.connection.createChannel();
        this.channel.on('close', this.onChannelClosed);
        this.channel.on('error', this.onChannelError);

        await this.channel.assertQueue(this.queueName, {
            durable: false,
            autoDelete: true
        });
        await this.channel.prefetch(this.prefetchCount);
    }

    onChannelClosed() {
        console.log('Channel closed');
    }

    onChannelError(err) {
        console.log('Channel error');
        console.log(err);
    }

    async get() {
        return await this.channel.get(this.queueName, {noAck: false});
    }

    async ack(msg) {
        await this.channel.ack(msg);
    }

    async nack(msg) {
        await this.channel.nack(msg);
    }

    async close() {
        await this.connection.close();
    }
}


async function connect(consumer, connectionAttempts, connectionInterval=5000) {
    try {
        await consumer.connect();
        return consumer;
    } catch (e) {
        console.log(e);
        console.log('Failed to connect to RabbitMQ. Retrying.');
        connectionAttempts -= 1;

        if (connectionAttempts < 1) {
            console.log('All retries failed.');
            throw e;
        }

        await new Promise(resolve => setTimeout(resolve, connectionInterval));
        return connect(consumer, connectionAttempts);
    }
}


async function load(hostname, port, username, password, vhost, heartbeat, connectionAttempts, queueName) {
    const consumer = new Consumer(hostname, port, username, password, vhost, heartbeat, queueName);
    return await connect(consumer, connectionAttempts);
}


module.exports = {load: load};
