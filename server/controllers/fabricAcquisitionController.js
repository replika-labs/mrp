const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const prisma = new PrismaClient();

// Get all purchase logs with filtering and pagination
const getAllPurchaseLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            supplier,
            materialId,
            startDate,
            endDate,
            sortBy = 'purchaseDate',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {
            isActive: true
        };

        if (status) {
            where.status = status.toUpperCase();
        }

        if (supplier) {
            where.supplier = {
                contains: supplier,
                mode: 'insensitive'
            };
        }

        if (materialId) {
            where.materialId = parseInt(materialId);
        }

        if (startDate || endDate) {
            where.purchaseDate = {};
            if (startDate) {
                where.purchaseDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.purchaseDate.lte = new Date(endDate);
            }
        }

        // Validate and build orderBy
        const validSortFields = [
            'id', 'materialId', 'supplier', 'quantity', 'unit', 'pricePerUnit',
            'totalCost', 'purchaseDate', 'invoiceNumber', 'status', 'deliveryDate',
            'receivedQuantity', 'createdAt', 'updatedAt'
        ];

        const sortField = validSortFields.includes(sortBy) ? sortBy : 'purchaseDate';
        const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

        const orderBy = {};
        orderBy[sortField] = sortDirection;

        // Get purchase logs with pagination
        const [purchaseLogs, totalCount] = await Promise.all([
            prisma.purchaseLog.findMany({
                where,
                include: {
                    material: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            unit: true
                        }
                    }
                },
                orderBy,
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.purchaseLog.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.json({
            success: true,
            data: {
                purchaseLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('❌ Error getting purchase logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase logs',
            error: error.message
        });
    }
};

// Get purchase log by ID
const getPurchaseLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const purchaseLog = await prisma.purchaseLog.findUnique({
            where: {
                id: parseInt(id),
                isActive: true
            },
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                },
                movement: true,
                contactNotes: {
                    include: {
                        createdByUser: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!purchaseLog) {
            return res.status(404).json({
                success: false,
                message: 'Purchase log not found'
            });
        }

        res.json({
            success: true,
            data: purchaseLog
        });

    } catch (error) {
        console.error('❌ Error getting purchase log by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase log',
            error: error.message
        });
    }
};

// Create new purchase log
const createPurchaseLog = async (req, res) => {
    try {
        const {
            materialId,
            supplier,
            quantity,
            unit,
            pricePerUnit,
            purchaseDate,
            invoiceNumber,
            receiptPath,
            notes,
            deliveryDate,
            receivedQuantity
        } = req.body;

        // Validation
        if (!materialId || !supplier || !quantity || !pricePerUnit || !purchaseDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: materialId, supplier, quantity, pricePerUnit, purchaseDate'
            });
        }

        // Verify material exists
        const material = await prisma.material.findUnique({
            where: { id: parseInt(materialId) }
        });

        if (!material) {
            return res.status(400).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Validate numeric inputs
        const parsedQuantity = parseFloat(quantity);
        const parsedPricePerUnit = parseFloat(pricePerUnit);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a positive number'
            });
        }

        if (isNaN(parsedPricePerUnit) || parsedPricePerUnit <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price per unit must be a positive number'
            });
        }

        // Check for reasonable limits to prevent overflow
        if (parsedPricePerUnit > 999999999) {
            return res.status(400).json({
                success: false,
                message: 'Price per unit is too large. Maximum allowed is 999,999,999'
            });
        }

        if (parsedQuantity > 999999999) {
            return res.status(400).json({
                success: false,
                message: 'Quantity is too large. Maximum allowed is 999,999,999'
            });
        }

        // Calculate total cost with precision handling
        const totalCost = Math.round((parsedQuantity * parsedPricePerUnit) * 100) / 100;

        // Check if total cost is within reasonable limits
        if (totalCost > 999999999999.99) {
            return res.status(400).json({
                success: false,
                message: 'Total cost is too large. Please reduce quantity or price per unit'
            });
        }

        // Generate invoice number if not provided
        const generatedInvoiceNumber = invoiceNumber?.trim() ||
            `INV-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        // Create purchase log
        const purchaseLog = await prisma.purchaseLog.create({
            data: {
                materialId: parseInt(materialId),
                supplier: supplier.trim(),
                quantity: parsedQuantity,
                unit: unit || material.unit || 'pcs',
                pricePerUnit: parsedPricePerUnit,
                totalCost,
                purchaseDate: new Date(purchaseDate),
                invoiceNumber: generatedInvoiceNumber,
                receiptPath: receiptPath?.trim() || null,
                notes: notes?.trim() || null,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                receivedQuantity: receivedQuantity ? parseFloat(receivedQuantity) : null,
                status: 'PENDING'
            },
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Purchase log created successfully',
            data: purchaseLog
        });

    } catch (error) {
        console.error('❌ Error creating purchase log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase log',
            error: error.message
        });
    }
};

// Update purchase log
const updatePurchaseLog = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            materialId,
            supplier,
            quantity,
            unit,
            pricePerUnit,
            purchaseDate,
            invoiceNumber,
            receiptPath,
            notes,
            deliveryDate,
            receivedQuantity,
            status
        } = req.body;

        // Check if purchase log exists
        const existingPurchaseLog = await prisma.purchaseLog.findUnique({
            where: {
                id: parseInt(id),
                isActive: true
            },
            include: {
                material: true,
                movement: true
            }
        });

        if (!existingPurchaseLog) {
            return res.status(404).json({
                success: false,
                message: 'Purchase log not found'
            });
        }

        // If materialId is being changed, verify it exists
        if (materialId && materialId !== existingPurchaseLog.materialId) {
            const material = await prisma.material.findUnique({
                where: { id: parseInt(materialId) }
            });

            if (!material) {
                return res.status(400).json({
                    success: false,
                    message: 'Material not found'
                });
            }
        }

        // Prepare update data
        const updateData = {};

        if (materialId !== undefined) updateData.materialId = parseInt(materialId);
        if (supplier !== undefined) updateData.supplier = supplier.trim();

        // Validate and process quantity
        if (quantity !== undefined) {
            const parsedQuantity = parseFloat(quantity);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be a positive number'
                });
            }
            if (parsedQuantity > 999999999) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity is too large. Maximum allowed is 999,999,999'
                });
            }
            updateData.quantity = parsedQuantity;
        }

        if (unit !== undefined) updateData.unit = unit;

        // Validate and process pricePerUnit
        if (pricePerUnit !== undefined) {
            const parsedPricePerUnit = parseFloat(pricePerUnit);
            if (isNaN(parsedPricePerUnit) || parsedPricePerUnit <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price per unit must be a positive number'
                });
            }
            if (parsedPricePerUnit > 999999999) {
                return res.status(400).json({
                    success: false,
                    message: 'Price per unit is too large. Maximum allowed is 999,999,999'
                });
            }
            updateData.pricePerUnit = parsedPricePerUnit;
        }

        if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
        if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber?.trim() || null;
        if (receiptPath !== undefined) updateData.receiptPath = receiptPath?.trim() || null;
        if (notes !== undefined) updateData.notes = notes?.trim() || null;
        if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
        if (receivedQuantity !== undefined) updateData.receivedQuantity = receivedQuantity ? parseFloat(receivedQuantity) : null;
        if (status !== undefined) {
            // Validate status
            const validStatuses = ['PENDING', 'RECEIVED', 'CANCELLED'];
            if (!validStatuses.includes(status.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be one of: PENDING, RECEIVED, CANCELLED'
                });
            }
            updateData.status = status.toUpperCase();
        }

        // Recalculate total cost if quantity or pricePerUnit changed
        if (quantity !== undefined || pricePerUnit !== undefined) {
            const newQuantity = quantity !== undefined ? updateData.quantity : existingPurchaseLog.quantity;
            const newPricePerUnit = pricePerUnit !== undefined ? updateData.pricePerUnit : existingPurchaseLog.pricePerUnit;
            const newTotalCost = Math.round((newQuantity * newPricePerUnit) * 100) / 100;

            // Check if total cost is within reasonable limits
            if (newTotalCost > 999999999999.99) {
                return res.status(400).json({
                    success: false,
                    message: 'Total cost is too large. Please reduce quantity or price per unit'
                });
            }

            updateData.totalCost = newTotalCost;
        }

        // Handle material movement if status changes to/from RECEIVED
        const oldStatus = existingPurchaseLog.status;
        const newStatus = updateData.status || oldStatus;

        // Use transaction to handle purchase update and material movement
        const result = await prisma.$transaction(async (tx) => {
            // Update purchase log
            const updatedPurchaseLog = await tx.purchaseLog.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    material: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            unit: true
                        }
                    }
                }
            });

            // If status changed to RECEIVED and no movement exists yet, create material movement
            if (newStatus === 'RECEIVED' && oldStatus !== 'RECEIVED' && !existingPurchaseLog.movement) {
                const quantityReceived = updatedPurchaseLog.receivedQuantity || updatedPurchaseLog.quantity;
                const material = existingPurchaseLog.material;
                const newQtyOnHand = parseFloat(material.qtyOnHand) + parseFloat(quantityReceived);

                // Create material movement for purchase receipt
                await tx.materialMovement.create({
                    data: {
                        materialId: updatedPurchaseLog.materialId,
                        userId: 1, // System user - could be made configurable
                        purchaseLogId: parseInt(id),
                        movementType: 'IN',
                        quantity: parseFloat(quantityReceived),
                        unit: updatedPurchaseLog.unit,
                        costPerUnit: updatedPurchaseLog.pricePerUnit,
                        totalCost: parseFloat(quantityReceived) * parseFloat(updatedPurchaseLog.pricePerUnit),
                        notes: `Automatic stock in from purchase: ${updatedPurchaseLog.supplier}`,
                        qtyAfter: newQtyOnHand,
                        movementDate: new Date()
                    }
                });

                // Update material stock
                await tx.material.update({
                    where: { id: updatedPurchaseLog.materialId },
                    data: { qtyOnHand: newQtyOnHand }
                });
            }

            // If status changed from RECEIVED to something else and movement exists, reverse it
            if (oldStatus === 'RECEIVED' && newStatus !== 'RECEIVED' && existingPurchaseLog.movement) {
                const movement = existingPurchaseLog.movement;
                const material = existingPurchaseLog.material;
                const newQtyOnHand = parseFloat(material.qtyOnHand) - parseFloat(movement.quantity);

                // Check if reversal would result in negative stock
                if (newQtyOnHand < 0) {
                    throw new Error(`Cannot change status from RECEIVED - would result in negative stock. Current: ${material.qtyOnHand}, Movement: ${movement.quantity}`);
                }

                // Soft delete the movement
                await tx.materialMovement.update({
                    where: { id: movement.id },
                    data: { isActive: false }
                });

                // Update material stock
                await tx.material.update({
                    where: { id: updatedPurchaseLog.materialId },
                    data: { qtyOnHand: newQtyOnHand }
                });
            }

            return updatedPurchaseLog;
        });

        res.json({
            success: true,
            message: `Purchase log updated successfully${newStatus === 'RECEIVED' && oldStatus !== 'RECEIVED' ? ' and stock updated' : ''}`,
            data: result
        });

    } catch (error) {
        console.error('❌ Error updating purchase log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update purchase log',
            error: error.message
        });
    }
};

// Update purchase log status only
const updatePurchaseLogStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // Validate status
        const validStatuses = ['PENDING', 'RECEIVED', 'CANCELLED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: PENDING, RECEIVED, CANCELLED'
            });
        }

        // Check if purchase log exists
        const existingPurchaseLog = await prisma.purchaseLog.findUnique({
            where: {
                id: parseInt(id),
                isActive: true
            },
            include: {
                material: true,
                movement: true
            }
        });

        if (!existingPurchaseLog) {
            return res.status(404).json({
                success: false,
                message: 'Purchase log not found'
            });
        }

        const newStatus = status.toUpperCase();
        const oldStatus = existingPurchaseLog.status;

        // Use transaction to handle status update and material movement creation
        const result = await prisma.$transaction(async (tx) => {
            // Update purchase log status
            const updatedPurchaseLog = await tx.purchaseLog.update({
                where: { id: parseInt(id) },
                data: {
                    status: newStatus
                },
                include: {
                    material: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            unit: true
                        }
                    }
                }
            });

            // If status changed to RECEIVED and no movement exists yet, create material movement
            if (newStatus === 'RECEIVED' && oldStatus !== 'RECEIVED' && !existingPurchaseLog.movement) {
                const quantityReceived = existingPurchaseLog.receivedQuantity || existingPurchaseLog.quantity;
                const material = existingPurchaseLog.material;
                const newQtyOnHand = parseFloat(material.qtyOnHand) + parseFloat(quantityReceived);

                // Create material movement for purchase receipt
                await tx.materialMovement.create({
                    data: {
                        materialId: existingPurchaseLog.materialId,
                        userId: 1, // System user - could be made configurable
                        purchaseLogId: parseInt(id),
                        movementType: 'IN',
                        quantity: parseFloat(quantityReceived),
                        unit: existingPurchaseLog.unit,
                        costPerUnit: existingPurchaseLog.pricePerUnit,
                        totalCost: parseFloat(quantityReceived) * parseFloat(existingPurchaseLog.pricePerUnit),
                        notes: `Automatic stock in from purchase: ${existingPurchaseLog.supplier}`,
                        qtyAfter: newQtyOnHand,
                        movementDate: new Date()
                    }
                });

                // Update material stock
                await tx.material.update({
                    where: { id: existingPurchaseLog.materialId },
                    data: { qtyOnHand: newQtyOnHand }
                });
            }

            // If status changed from RECEIVED to something else and movement exists, reverse it
            if (oldStatus === 'RECEIVED' && newStatus !== 'RECEIVED' && existingPurchaseLog.movement) {
                const movement = existingPurchaseLog.movement;
                const material = existingPurchaseLog.material;
                const newQtyOnHand = parseFloat(material.qtyOnHand) - parseFloat(movement.quantity);

                // Check if reversal would result in negative stock
                if (newQtyOnHand < 0) {
                    throw new Error(`Cannot change status from RECEIVED - would result in negative stock. Current: ${material.qtyOnHand}, Movement: ${movement.quantity}`);
                }

                // Soft delete the movement
                await tx.materialMovement.update({
                    where: { id: movement.id },
                    data: { isActive: false }
                });

                // Update material stock
                await tx.material.update({
                    where: { id: existingPurchaseLog.materialId },
                    data: { qtyOnHand: newQtyOnHand }
                });
            }

            return updatedPurchaseLog;
        });

        res.json({
            success: true,
            message: `Status updated to ${newStatus}${newStatus === 'RECEIVED' ? ' and stock updated' : ''}`,
            data: result
        });

    } catch (error) {
        console.error('❌ Error updating purchase log status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

// Soft delete purchase log
const deletePurchaseLog = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if purchase log exists
        const existingPurchaseLog = await prisma.purchaseLog.findUnique({
            where: {
                id: parseInt(id),
                isActive: true
            }
        });

        if (!existingPurchaseLog) {
            return res.status(404).json({
                success: false,
                message: 'Purchase log not found'
            });
        }

        // Check if there are related material movements
        const relatedMovement = await prisma.materialMovement.findFirst({
            where: { purchaseLogId: parseInt(id) }
        });

        if (relatedMovement) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete purchase log with related material movements'
            });
        }

        // Soft delete
        await prisma.purchaseLog.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'Purchase log deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting purchase log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete purchase log',
            error: error.message
        });
    }
};

// Get purchase logs by material
const getPurchaseLogsByMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { limit = 10 } = req.query;

        const purchaseLogs = await prisma.purchaseLog.findMany({
            where: {
                materialId: parseInt(materialId),
                isActive: true
            },
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: purchaseLogs
        });

    } catch (error) {
        console.error('❌ Error getting purchase logs by material:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase logs by material',
            error: error.message
        });
    }
};

// Get purchase logs by supplier
const getPurchaseLogsBySupplier = async (req, res) => {
    try {
        const { supplier } = req.params;
        const { limit = 10 } = req.query;

        const purchaseLogs = await prisma.purchaseLog.findMany({
            where: {
                supplier: {
                    contains: supplier,
                    mode: 'insensitive'
                },
                isActive: true
            },
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: purchaseLogs
        });

    } catch (error) {
        console.error('❌ Error getting purchase logs by supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase logs by supplier',
            error: error.message
        });
    }
};

// Get purchase logs by date range
const getPurchaseLogsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const purchaseLogs = await prisma.purchaseLog.findMany({
            where: {
                purchaseDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                },
                isActive: true
            },
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' }
        });

        res.json({
            success: true,
            data: purchaseLogs
        });

    } catch (error) {
        console.error('❌ Error getting purchase logs by date range:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase logs by date range',
            error: error.message
        });
    }
};

// Get purchase log analytics
const getPurchaseLogAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {
            isActive: true
        };

        if (startDate || endDate) {
            dateFilter.purchaseDate = {};
            if (startDate) dateFilter.purchaseDate.gte = new Date(startDate);
            if (endDate) dateFilter.purchaseDate.lte = new Date(endDate);
        }

        // Get analytics data
        const [
            totalPurchases,
            totalValue,
            statusCounts,
            topSuppliers,
            topMaterials,
            monthlyTrends
        ] = await Promise.all([
            // Total purchases
            prisma.purchaseLog.count({ where: dateFilter }),

            // Total value
            prisma.purchaseLog.aggregate({
                where: dateFilter,
                _sum: { totalCost: true }
            }),

            // Status counts
            prisma.purchaseLog.groupBy({
                by: ['status'],
                where: dateFilter,
                _count: { status: true }
            }),

            // Top suppliers
            prisma.purchaseLog.groupBy({
                by: ['supplier'],
                where: dateFilter,
                _count: { supplier: true },
                _sum: { totalCost: true },
                orderBy: { _sum: { totalCost: 'desc' } },
                take: 5
            }),

            // Top materials
            prisma.purchaseLog.groupBy({
                by: ['materialId'],
                where: dateFilter,
                _count: { materialId: true },
                _sum: { totalCost: true },
                orderBy: { _sum: { totalCost: 'desc' } },
                take: 5
            }),

            // Monthly trends (last 6 months)
            prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "purchaseDate") as month,
          COUNT(*)::int as count,
          SUM("totalCost")::float as total_value
        FROM "purchase_logs" 
        WHERE "isActive" = true 
          AND "purchaseDate" >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "purchaseDate")
        ORDER BY month DESC
      `
        ]);

        // Get material names for top materials
        const materialIds = topMaterials.map(tm => tm.materialId);
        const materialNames = await prisma.material.findMany({
            where: { id: { in: materialIds } },
            select: { id: true, name: true, code: true }
        });

        const topMaterialsWithNames = topMaterials.map(tm => ({
            ...tm,
            material: materialNames.find(m => m.id === tm.materialId)
        }));

        res.json({
            success: true,
            data: {
                totalPurchases,
                totalValue: totalValue._sum.totalCost || 0,
                statusCounts,
                topSuppliers,
                topMaterials: topMaterialsWithNames,
                monthlyTrends
            }
        });

    } catch (error) {
        console.error('❌ Error getting purchase log analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get purchase log analytics',
            error: error.message
        });
    }
};

/**
 * Format currency to simple Indonesian format
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
const formatSimpleCurrency = (amount) => {
    // Handle invalid or zero amounts
    if (!amount || amount === 0 || isNaN(amount) || !isFinite(amount)) {
        return 'Rp. 0';
    }
    
    // Convert to number and get absolute value
    const numAmount = Number(amount);
    const absAmount = Math.abs(numAmount);
    
    // Handle very large numbers that might cause scientific notation
    if (absAmount >= 1000000000000) {
        // Trillions - too large, show in simplified format
        const trillions = Math.floor(absAmount / 1000000000000);
        return `Rp. ${trillions}T`;
    } else if (absAmount >= 1000000000) {
        // Billions (Milyar)
        const billions = Math.floor(absAmount / 1000000000);
        const remainder = Math.floor((absAmount % 1000000000) / 100000000);
        if (remainder > 0) {
            return `Rp. ${billions}.${remainder}M`;
        }
        return `Rp. ${billions}M`;
    } else if (absAmount >= 1000000) {
        // Millions (Juta)
        const millions = Math.floor(absAmount / 1000000);
        const remainder = Math.floor((absAmount % 1000000) / 100000);
        if (remainder > 0) {
            return `Rp. ${millions}.${remainder}jt`;
        }
        return `Rp. ${millions}jt`;
    } else if (absAmount >= 1000) {
        // Thousands (Ribu)
        const thousands = Math.floor(absAmount / 1000);
        return `Rp. ${thousands}rb`;
    } else {
        // Less than 1000
        return `Rp. ${Math.floor(absAmount)}`;
    }
};

/**
 * Download purchase logs report as PDF
 * Download ALL filtered results, not paginated
 */
const downloadPurchaseLogsReport = async (req, res) => {
    try {
        const {
            status,
            supplier,
            materialId,
            startDate,
            endDate,
            sortBy = 'purchaseDate',
            sortOrder = 'desc'
        } = req.body || req.query;

        // Build where clause - same as getAllPurchaseLogs but NO pagination
        const where = { isActive: true };

        if (status && status !== 'all' && status !== '') {
            where.status = status.toUpperCase();
        }

        if (supplier && supplier !== '') {
            where.supplier = {
                contains: supplier,
                mode: 'insensitive'
            };
        }

        if (materialId && materialId !== '' && materialId !== 'all') {
            where.materialId = parseInt(materialId);
        }

        if (startDate || endDate) {
            where.purchaseDate = {};
            if (startDate) where.purchaseDate.gte = new Date(startDate);
            if (endDate) where.purchaseDate.lte = new Date(endDate + 'T23:59:59.999Z');
        }

        // Get ALL purchase logs (no pagination)
        const purchaseLogs = await prisma.purchaseLog.findMany({
            where,
            include: {
                material: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        unit: true
                    }
                }
            },
            orderBy: { [sortBy]: sortOrder.toLowerCase() }
        });

        // Calculate summary data
        const totalPurchases = purchaseLogs.length;
        const totalValue = purchaseLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
        const receivedCount = purchaseLogs.filter(log => log.status === 'RECEIVED').length;
        const pendingCount = purchaseLogs.filter(log => log.status === 'PENDING').length;
        const cancelledCount = purchaseLogs.filter(log => log.status === 'CANCELLED').length;

        // Create PDF document in landscape
        const doc = new PDFDocument({ 
            layout: 'landscape',
            margin: 30,
            size: 'A4'
        });
        
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfData = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=purchase-logs-report-${new Date().toISOString().split('T')[0]}.pdf`);
            res.send(pdfData);
        });

        // Header
        doc.fontSize(20).text('Roselover Hijab', 50, 40);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 650, 45, { align: 'right' });

        // Mini Summary - simplified
        doc.fontSize(14).text('PURCHASE LOGS REPORT SUMMARY', 50, 80, { underline: true });
        doc.fontSize(10)
            .text(`Total Purchases: ${totalPurchases}`, 50, 100)
            .text(`Status: ${receivedCount} Received, ${pendingCount} Pending, ${cancelledCount} Cancelled`, 250, 100);

        // Applied Filters
        let filterText = 'Filters: ';
        filterText += status ? `Status=${status} ` : 'All Status ';
        filterText += materialId ? `Material=ID${materialId} ` : 'All Materials ';
        filterText += supplier ? `Supplier="${supplier}" ` : '';
        filterText += startDate ? `From=${startDate} ` : '';
        filterText += endDate ? `To=${endDate}` : '';
        
        doc.fontSize(9).text(filterText, 50, 120);

        // Table Header
        let yPosition = 150;
        const rowHeight = 20;
        const colWidths = [90, 140, 120, 90, 120, 80];
        let xPosition = 50;

        // Table headers
        doc.fontSize(8).fillColor('black');
        const headers = ['Date', 'Material', 'Supplier', 'Quantity', 'Total Cost', 'Status'];
        
        headers.forEach((header, i) => {
            doc.rect(xPosition, yPosition, colWidths[i], rowHeight).stroke();
            doc.text(header, xPosition + 5, yPosition + 6, { width: colWidths[i] - 10, align: 'center' });
            xPosition += colWidths[i];
        });

        yPosition += rowHeight;

        // Table Data
        purchaseLogs.forEach((log, index) => {
            if (yPosition > 500) { // New page if needed
                doc.addPage();
                yPosition = 50;
            }

            xPosition = 50;
            const values = [
                new Date(log.purchaseDate).toLocaleDateString(),
                (log.material?.name || 'Unknown').substring(0, 20),
                (log.supplier || 'No supplier').substring(0, 18),
                `${log.quantity} ${log.unit}`,
                formatSimpleCurrency(log.totalCost || 0),
                log.status
            ];

            values.forEach((value, i) => {
                doc.rect(xPosition, yPosition, colWidths[i], rowHeight).stroke();
                doc.fontSize(7).text(value, xPosition + 2, yPosition + 6, { 
                    width: colWidths[i] - 4, 
                    align: i === 3 || i === 4 ? 'center' : 'left' 
                });
                xPosition += colWidths[i];
            });

            yPosition += rowHeight;
        });

        // Footer
        doc.fontSize(8).text(
            `Report contains ${purchaseLogs.length} records | Generated on ${new Date().toLocaleString()}`, 
            50, 
            yPosition + 30
        );

        doc.end();

    } catch (error) {
        console.error('❌ Error generating purchase logs report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate purchase logs report',
            error: error.message
        });
    }
};

module.exports = {
    getAllPurchaseLogs,
    getPurchaseLogById,
    createPurchaseLog,
    updatePurchaseLog,
    deletePurchaseLog,
    updatePurchaseLogStatus,
    getPurchaseLogsByMaterial,
    getPurchaseLogsBySupplier,
    getPurchaseLogsByDateRange,
    getPurchaseLogAnalytics,
    downloadPurchaseLogsReport
}; 