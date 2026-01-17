"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const processes_module_1 = require("./processes/processes.module");
const interactions_module_1 = require("./interactions/interactions.module");
const reviews_module_1 = require("./reviews/reviews.module");
const contacts_service_1 = require("./contacts/contacts.service");
const contacts_controller_1 = require("./contacts/contacts.controller");
const prisma_service_1 = require("./prisma.service");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const resources_module_1 = require("./resources/resources.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            processes_module_1.ProcessesModule,
            interactions_module_1.InteractionsModule,
            reviews_module_1.ReviewsModule,
            resources_module_1.ResourcesModule,
        ],
        controllers: [app_controller_1.AppController, contacts_controller_1.ContactsController],
        providers: [app_service_1.AppService, contacts_service_1.ContactsService, prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map