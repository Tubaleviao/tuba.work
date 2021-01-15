type Page = {
    title?: string,
    nav?: Array<string>,
    user?: string,
    token?: string,
    userinfo?: string,
    musics?: Array<string>,
    size?: string,
    permission?: number,
    owner?: boolean,
    notes?: Array<string>,
    ip?: string, // chat
    room?: string,
}

type Visit = {
    ip: string,
    date: number,
    user: string,
    page?: string
}