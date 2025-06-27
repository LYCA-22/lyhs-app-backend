// 定義參與者信息介面
export interface Participant {
	id?: number;
	applicationId: number;
	name: string;
	studentId: string;
	contactEmail: string;
	class: string;
}

// 定義參與者信息作為JSON儲存的介面
export interface ParticipantInfo {
	name: string;
	studentId: string;
	contactEmail: string;
	class: string;
}

// 定義活動報名類別
export class EventApplication {
	id?: number;
	eventId: string;
	isTeam: boolean;
	teamName?: string;
	participantsCount: number;
	participantsData?: string; // JSON格式存儲的參與者資料
	fileName?: string;
	fileUrl?: string;
	note?: string;
	createdAt: string;
	participants?: Participant[]; // 關聯的參與者資料

	constructor(data: {
		id?: number;
		eventId: string;
		isTeam: boolean;
		teamName?: string;
		participantsCount: number;
		participantsData?: string;
		fileName?: string;
		fileUrl?: string;
		note?: string;
		createdAt?: string;
		participants?: Participant[];
	}) {
		this.id = data.id;
		this.eventId = data.eventId;
		this.isTeam = data.isTeam;
		this.teamName = data.teamName;
		this.participantsCount = data.participantsCount;
		this.participantsData = data.participantsData;
		this.fileName = data.fileName;
		this.fileUrl = data.fileUrl;
		this.note = data.note;
		this.createdAt = data.createdAt || new Date().toISOString();
		this.participants = data.participants;
	}

	// 將參與者資料轉換為JSON字符串
	setParticipantsAsJson(participants: ParticipantInfo[]): void {
		this.participantsData = JSON.stringify(participants);
		this.participantsCount = participants.length;
	}

	// 從JSON字符串解析參與者資料
	getParticipantsFromJson(): ParticipantInfo[] | null {
		if (!this.participantsData) return null;
		try {
			return JSON.parse(this.participantsData) as ParticipantInfo[];
		} catch (error) {
			console.error('解析參與者資料錯誤:', error);
			return null;
		}
	}
}

// 定義參與者類
export class EventParticipant implements Participant {
	id?: number;
	applicationId: number;
	name: string;
	studentId: string;
	contactEmail: string;
	class: string;

	constructor(data: { id?: number; applicationId: number; name: string; studentId: string; contactEmail: string; class: string }) {
		this.id = data.id;
		this.applicationId = data.applicationId;
		this.name = data.name;
		this.studentId = data.studentId;
		this.contactEmail = data.contactEmail;
		this.class = data.class;
	}
}
