"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const fs_1 = require("fs");
const user_entity_1 = require("./src/users/user.entity");
const process_entity_1 = require("./src/processes/process.entity");
const interaction_entity_1 = require("./src/interactions/interaction.entity");
const contact_entity_1 = require("./src/contacts/contact.entity");
const resource_entity_1 = require("./src/resources/resource.entity");
const self_review_entity_1 = require("./src/reviews/self-review.entity");
const profile_entity_1 = require("./src/profiles/profile.entity");
const envPath = (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'backend', '.env'))
    ? (0, path_1.join)(process.cwd(), 'backend', '.env')
    : (0, path_1.join)(process.cwd(), '.env');
(0, dotenv_1.config)({ path: envPath });
const config = {
    driver: postgresql_1.PostgreSqlDriver,
    clientUrl: process.env.DATABASE_URL,
    driverOptions: {
        connection: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    },
    entities: [
        user_entity_1.User,
        process_entity_1.Process,
        interaction_entity_1.Interaction,
        contact_entity_1.Contact,
        resource_entity_1.Resource,
        self_review_entity_1.SelfReview,
        profile_entity_1.Profile,
    ],
    allowGlobalContext: true,
};
exports.default = config;
//# sourceMappingURL=mikro-orm.config.js.map