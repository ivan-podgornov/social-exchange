SELECT
    offers.*,
    IFNULL(dispenses_count.count, 0) AS `dispenses_count`,
    IFNULL(executions_count.count, 0) AS `executions_count`
FROM `offers`
INNER JOIN (
    SELECT link, MIN(created_at) AS `min_created_at`
    FROM `offers` `min`
    WHERE status = 'active'
    GROUP BY link
) `min` ON offers.link = min.link
LEFT JOIN (
    SELECT
        offers.link,
        offers.type,
        offers.networkType,
        COUNT(offers.link) AS `count`
    FROM `dispense`
    INNER JOIN `offers`
        ON dispense.offer_id = offers.id
        AND offers.networkType = 'vk'
        AND offers.type = 'likes'
    WHERE dispense.expires > CURRENT_TIMESTAMP
    GROUP BY offers.link, offers.type, offers.networkType
) `dispenses_count` ON offers.link = dispenses_count.link
LEFT JOIN (
    SELECT
        executions.id,
        executions.offer_id,
        COUNT(executions.offer_id) AS `count`
    FROM `executions`
    GROUP BY executions.id, executions.offer_id
) `executions_count` ON offers.id = executions_count.offer_id
WHERE
    offers.owner_id != 3
    AND offers.created_at = min.min_created_at
    AND IFNULL(executions_count.count, 0) + IFNULL(dispenses_count.count, 0) < offers.count
    AND offers.networkType = 'vk'
    AND offers.type = 'likes'
    AND offers.status = 'active'
    AND IFNULL(dispenses_count.count, 0) < 100 / (
        CASE
            WHEN YEAR(offers.object_created) = YEAR(CURRENT_DATE)
            AND DAYOFYEAR(offers.object_created) = DAYOFYEAR(CURRENT_DATE)
        THEN 2
        ELSE 1
    END)
    AND offers.link NOT IN (
        SELECT DISTINCT(offers.link)
        FROM `dispense`
        INNER JOIN offers
            ON dispense.recipient_id = 3
            AND dispense.expires > CURRENT_TIMESTAMP
            AND dispense.offer_id = offers.id
            AND offers.networkType = 'vk'
            AND offers.type = 'likes'
    )
    AND offers.link NOT IN (
        SELECT offers.link AS `offer_link`
        FROM `executions`
        INNER JOIN `offers`
            ON executions.profile_id = 3
            AND executions.offer_id = offers.id
            AND offers.networkType = 'vk'
            AND offers.type = 'likes'
    )
    ORDER BY RAND() ASC
    LIMIT 5;