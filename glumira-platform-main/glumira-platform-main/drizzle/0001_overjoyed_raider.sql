CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`changes` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `basalProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`profileName` varchar(255),
	`hour` int NOT NULL,
	`basalRate` decimal(10,3) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `basalProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`typosDetected` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`sessionName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `glucoseReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`glucoseValue` decimal(10,2) NOT NULL,
	`glucoseUnit` enum('mg/dL','mmol/L') DEFAULT 'mg/dL',
	`readingType` enum('cgm','fingerstick','manual') NOT NULL,
	`cgmSource` varchar(100),
	`timestamp` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `glucoseReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insulinDoses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`doseType` enum('bolus','basal','correction') NOT NULL,
	`insulinType` enum('rapid','short','intermediate','long','ultra-long'),
	`amount` decimal(10,3) NOT NULL,
	`carbohydrates` decimal(10,1),
	`reason` varchar(255),
	`timestamp` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insulinDoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iobCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`timestamp` timestamp NOT NULL,
	`totalIOB` decimal(10,3) NOT NULL,
	`bolusIOB` decimal(10,3) NOT NULL,
	`basalIOB` decimal(10,3) NOT NULL,
	`decayModel` varchar(50) DEFAULT 'exponential',
	`decayData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iobCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patientProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` text,
	`lastName` text,
	`dateOfBirth` timestamp,
	`diabetesType` enum('type1','type2','gestational','other'),
	`insulinSensitivityFactor` decimal(10,2),
	`carbRatio` decimal(10,2),
	`targetGlucoseMin` decimal(10,2),
	`targetGlucoseMax` decimal(10,2),
	`glucoseUnit` enum('mg/dL','mmol/L') DEFAULT 'mg/dL',
	`insulinUnit` enum('U','mU') DEFAULT 'U',
	`iobDecayTime` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patientProfiles_id` PRIMARY KEY(`id`)
);
