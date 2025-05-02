import { getRefunded } from './basednames';

export default async function refund(req, res) {
    const refunds = getRefunded();

    res.status(200).json({ refunds });
}
