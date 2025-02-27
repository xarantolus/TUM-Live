import { Delete, getData, postData, putData, Time } from "./global";
import { getPlayers } from "./TUMLiveVjs";

export class BookmarkList {
    private readonly streamId: number;

    private list: Bookmark[];

    constructor(streamId: number) {
        this.streamId = streamId;
    }

    get(): Bookmark[] {
        return this.list;
    }

    length(): number {
        return this.list !== undefined ? this.list.length : 0;
    }

    async delete(id: number) {
        await Bookmarks.delete(id).then(() => {
            const index = this.list.findIndex((b) => b.ID === id);
            this.list.splice(index, 1);
        });
    }

    async fetch() {
        this.list = (await Bookmarks.get(this.streamId)) ?? [];
        this.list.forEach((b) => {
            b.update = updateBookmark;
            b.friendlyTimestamp = new Time(b.hours, b.minutes, b.seconds).toString();
        });
    }
}

export class BookmarkDialog {
    private readonly streamId: number;

    request: AddBookmarkRequest;

    constructor(streamId: number) {
        this.streamId = streamId;
    }

    async submit() {
        // convert strings to number
        this.request.Hours = +this.request.Hours;
        this.request.Minutes = +this.request.Minutes;
        this.request.Seconds = +this.request.Seconds;
        await Bookmarks.add(this.request);
    }

    reset(): void {
        const player = getPlayers()[0];
        const time = Time.FromSeconds(player.currentTime()).toObject();
        this.request = {
            StreamID: this.streamId,
            Description: "",
            Hours: time.hours,
            Minutes: time.minutes,
            Seconds: time.seconds,
        };
    }
}

export class BookmarkUpdater {
    private readonly bookmark: Bookmark;

    request: UpdateBookmarkRequest;
    show: boolean;

    constructor(b: Bookmark) {
        this.bookmark = b;
        this.reset();
    }

    async submit() {
        await this.bookmark.update(this.request).then(() => (this.show = false));
    }

    reset() {
        this.show = false;
        this.request = new UpdateBookmarkRequest();
        this.request.Description = this.bookmark.description;
    }
}

type Bookmark = {
    ID: number;
    description: string;
    hours: number;
    minutes: number;
    seconds: number;
    friendlyTimestamp?: string;

    update?: (UpdateBookmarkRequest) => Promise<void>;
};

async function updateBookmark(request: UpdateBookmarkRequest): Promise<void> {
    // this = Bookmark object
    if (this.description !== request.Description) {
        return await Bookmarks.update(this.ID, request).then(() => {
            this.description = request.Description;
        });
    }
}

const Bookmarks = {
    get: async function (streamId: number): Promise<Bookmark[]> {
        return getData("/api/bookmarks?streamID=" + streamId)
            .then((resp) => {
                if (!resp.ok) {
                    throw Error(resp.statusText);
                }
                return resp.json();
            })
            .catch((err) => {
                console.error(err);
            })
            .then((j: Promise<Bookmark[]>) => j);
    },
    add: (request: AddBookmarkRequest) => {
        return postData("/api/bookmarks", request)
            .then((resp) => {
                if (!resp.ok) {
                    throw Error(resp.statusText);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    },

    update: (bookmarkId: number, request: UpdateBookmarkRequest) => {
        return putData("/api/bookmarks/" + bookmarkId, request)
            .then((resp) => {
                if (!resp.ok) {
                    throw Error(resp.statusText);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    },

    delete: (bookmarkId: number) => {
        return Delete("/api/bookmarks/" + bookmarkId)
            .then((resp) => {
                if (!resp.ok) {
                    throw Error(resp.statusText);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    },
};

class AddBookmarkRequest {
    StreamID: number;
    Description: string;
    Hours: number;
    Minutes: number;
    Seconds: number;
}

class UpdateBookmarkRequest {
    Description: string;
}
