import { PrismaClient } from '@prisma/client';
import { TransactionType } from '../type';

const prisma = new PrismaClient();

export const storeTxInfo = async (user: string, token: string, sig: string, type: TransactionType, tokenAmount?: number, tokenDecimal?: number, solAmount?: number) => {
    try {
        await prisma.transaction.create({
            data: {
                user,
                token,
                type,
                sig,
                tokenAmount,
                tokenDecimal,
                solAmount
            },
        });
    } catch (err) {
        console.error("Error store tx info:", err);
    }
}

export const storeMintInfo = async (mint: string, description:string, name:string, symbol:string, file:string) => {
    try {
        await prisma.mintQueue.create({
            data: {
                mint,
                description,
                name,
                symbol,
                file
            }
        })
    } catch (err) {
        console.error('Store mint address:', err)
    }
}

export const storeArticle = async (author: string, content: string, replyto: string) => {
    try {
        const article = await prisma.article.create({
            data: {
                author,
                content,
                replyto
            }
        })
        return article.id
    } catch (err) {
        console.error("Error store article:", err);
        return undefined
    }
}

export const fetchArticle = async (replyto: string, skip: number = 0, take: number = 10) => {
    try {
        const articles = await prisma.article.findMany({
            where: {
                replyto
            },
            skip,
            take
        })
        return articles
    } catch (err) {
        console.error("Error store article:", err);
        return undefined
    }
}

export const reactArticle = async (replyto: string, user: string, reaction: boolean) => {
    try {
        const result = await prisma.$executeRaw`
            UPDATE "Article"
            SET "likes" = ARRAY_APPEND(${reaction ? "likes" : "dislikes"}, ${user})
            WHERE "replyto" = ${replyto} AND NOT (${user} = ANY(${reaction ? "likes" : "dislikes"}));
        `

        if (result > 0) return true
        return false
    } catch (err) {
        console.error("Error store article:", err);
        return undefined
    }
}