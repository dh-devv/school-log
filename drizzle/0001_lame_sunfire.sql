CREATE TABLE `school_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` enum('exam','holiday','school-anniversary','school-event','notice','other') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_items_id` PRIMARY KEY(`id`)
);
