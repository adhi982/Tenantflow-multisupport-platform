#!/usr/bin/env node

/**
 * FlowBit Platform - Multi-Tenant SaaS Backend
 * Entry point for the Express.js server
 */

const App = require('./app');

// Create and start the application
const application = new App();
application.listen();
