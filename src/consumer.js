#!/usr/bin/env node

'use strict';

var amqp = require('amqplib');


class Consumer {
    constructor(hostname, port, username, password, vhost, heartbeat, queueName) {
        this.hostname = hostname;
        this.port = port;
        this.username = username;
        this.password = password;
        this.vhost = vhost;
        this.heartbeat = heartbeat;
        this.queueName = queueName;

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
        await this.channel.checkQueue(this.queueName);

        this.channel.on('close', this.onChannelClosed);
        this.channel.on('error', this.onChannelError);
    }

    onChannelClosed() {
        console.log('Channel closed');
    }

    onChannelError(err) {
        console.log('Channel error');
        console.log(err);
    }

    async get() {
        const msg = await this.channel.get(this.queueName);
        if (msg) {
            await this.channel.ack(msg);
            return msg.content;
        }
    }

    async close() {
        await this.connection.close();
    }
}


async function _connect(consumer, connection_attempts, connection_interval=5000) {
    try {
        await consumer.connect();
        return consumer;
    } catch (e) {
        console.log(e);
        console.log('Failed to connect to RabbitMQ. Retrying.');
        connection_attempts -= 1;

        if (connection_attempts < 1) {
            console.log('All retries failed.');
            throw e;
        }

        await new Promise(resolve => setTimeout(resolve, connection_interval));
        return _connect(consumer, connection_attempts);
    }
}


async function connect(hostname, port, username, password, vhost, heartbeat, connection_attempts, queueName) {
    const consumer = new Consumer(hostname, port, username, password, vhost, heartbeat, queueName);
    return await _connect(consumer, connection_attempts);
}


module.exports = {connect: connect};
