export interface CompletedAreaSettings {
	completedAreaHierarchy: string;
	completedAreaName: string;
	showIcon: boolean;
	showStatusBar: boolean;
	autoMove: boolean;
	dateStamp: boolean;
	dateFormat: string;
	sortOrder: "append" | "prepend";
}

export const DEFAULT_SETTINGS: CompletedAreaSettings = {
	completedAreaHierarchy: "2",
	completedAreaName: "Completed",
	showIcon: true,
	showStatusBar: false,
	autoMove: false,
	dateStamp: false,
	dateFormat: "YYYY-MM-DD",
	sortOrder: "append",
};
