CREATE TABLE `mealPatientSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`activeRegimeId` varchar(50) NOT NULL,
	`customHypoThreshold` decimal(10,2),
	`customHyperThreshold` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mealPatientSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`eatenAt` timestamp NOT NULL,
	`carbsGrams` decimal(10,1) NOT NULL,
	`mealRegime` varchar(50),
	`mealName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
