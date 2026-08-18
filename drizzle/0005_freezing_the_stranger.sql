CREATE TABLE `support_view_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`endedAt` timestamp,
	CONSTRAINT `support_view_sessions_id` PRIMARY KEY(`id`)
);
