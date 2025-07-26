const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Helper function to generate material code for seeding
const generateMaterialCode = (totalUnits, materialName) => {
    // Generate 3 random alphabets
    const randomAlphabets = Array.from({ length: 3 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('')

    // Get current date in YYYYMMDD format
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    // Clean material name (remove spaces, special characters, limit to 6 chars)
    const cleanMaterialName = (materialName || 'UNKNOWN')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase()
        .slice(0, 6) || 'UNKNWN'

    // Format: [3 RANDOM ALPHABET]-[TOTAL_UNITS]-[MATERIAL_NAME]-[DATE_YYYYMMDD]
    return `${randomAlphabets}-${totalUnits}-${cleanMaterialName}-${currentDate}`
}

async function main() {
    console.log('Starting hijab WMS database seeding...')

    try {
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10)

        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@roselover.com' },
            update: {},
            create: {
                name: 'Hijab Store Administrator',
                email: 'admin@roselover.com',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                phone: '+62812345678',
                whatsappPhone: '+62812345678',
                isActive: true,
                loginEnabled: true
            }
        })

        console.log('✓ Admin user created:', adminUser.email)

        // Create operator user
        const operatorUser = await prisma.user.upsert({
            where: { email: 'operator@hijab.com' },
            update: {},
            create: {
                name: 'Warehouse Operator',
                email: 'operator@hijab.com',
                passwordHash: hashedPassword,
                role: 'OPERATOR',
                phone: '+62812345679',
                whatsappPhone: '+62812345679',
                isActive: true,
                loginEnabled: true
            }
        })

        console.log('✓ Operator user created:', operatorUser.email)

        // Create hijab-related materials with purchase history
        const materialData = [
            {
                material: {
                    name: 'Chiffon Fabric',
                    description: 'High quality chiffon fabric for premium hijabs',
                    code: generateMaterialCode(100, 'Chiffon Fabric'),
                    unit: 'meter',
                    qtyOnHand: 100.0,
                    minStock: 10.0,
                    maxStock: 200.0,
                    reorderPoint: 20.0,
                    reorderQty: 50.0,
                    location: 'Fabric Storage A1',
                    attributeType: 'Fabric',
                    attributeValue: 'Chiffon'
                },
                purchases: [
                    {
                        supplier: 'Premium Textile Indonesia',
                        quantity: 60.0,
                        pricePerUnit: 45000,
                        purchaseDate: new Date('2024-01-15'),
                        status: 'RECEIVED'
                    },
                    {
                        supplier: 'Premium Textile Indonesia',
                        quantity: 40.0,
                        pricePerUnit: 47000,
                        purchaseDate: new Date('2024-02-10'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Voile Fabric',
                    description: 'Soft and breathable voile fabric for daily hijabs',
                    code: generateMaterialCode(150, 'Voile Fabric'),
                    unit: 'meter',
                    qtyOnHand: 150.0,
                    minStock: 15.0,
                    maxStock: 300.0,
                    reorderPoint: 30.0,
                    reorderQty: 75.0,
                    location: 'Fabric Storage A2',
                    attributeType: 'Fabric',
                    attributeValue: 'Voile'
                },
                purchases: [
                    {
                        supplier: 'Hijab Fabric Supplier',
                        quantity: 100.0,
                        pricePerUnit: 35000,
                        purchaseDate: new Date('2024-01-20'),
                        status: 'RECEIVED'
                    },
                    {
                        supplier: 'Hijab Fabric Supplier',
                        quantity: 50.0,
                        pricePerUnit: 36000,
                        purchaseDate: new Date('2024-02-05'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Cotton Jersey',
                    description: 'Comfortable cotton jersey for inner hijabs',
                    code: generateMaterialCode(80, 'Cotton Jersey'),
                    unit: 'meter',
                    qtyOnHand: 80.0,
                    minStock: 8.0,
                    maxStock: 160.0,
                    reorderPoint: 15.0,
                    reorderQty: 40.0,
                    location: 'Fabric Storage B1',
                    attributeType: 'Fabric',
                    attributeValue: 'Cotton Jersey'
                },
                purchases: [
                    {
                        supplier: 'Cotton Textile Co.',
                        quantity: 80.0,
                        pricePerUnit: 28000,
                        purchaseDate: new Date('2024-01-25'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Silk Satin',
                    description: 'Luxurious silk satin for premium hijab collection',
                    code: generateMaterialCode(50, 'Silk Satin'),
                    unit: 'meter',
                    qtyOnHand: 50.0,
                    minStock: 5.0,
                    maxStock: 100.0,
                    reorderPoint: 10.0,
                    reorderQty: 25.0,
                    location: 'Premium Storage C1',
                    attributeType: 'Fabric',
                    attributeValue: 'Silk Satin'
                },
                purchases: [
                    {
                        supplier: 'Luxury Silk Imports',
                        quantity: 50.0,
                        pricePerUnit: 85000,
                        purchaseDate: new Date('2024-01-30'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Hijab Pins',
                    description: 'Decorative and functional hijab pins',
                    code: generateMaterialCode(500, 'Hijab Pins'),
                    unit: 'pcs',
                    qtyOnHand: 500.0,
                    minStock: 50.0,
                    maxStock: 1000.0,
                    reorderPoint: 100.0,
                    reorderQty: 200.0,
                    location: 'Accessories Storage D1',
                    attributeType: 'Accessories',
                    attributeValue: 'Pins'
                },
                purchases: [
                    {
                        supplier: 'Hijab Accessories Supplier',
                        quantity: 300.0,
                        pricePerUnit: 5000,
                        purchaseDate: new Date('2024-02-01'),
                        status: 'RECEIVED'
                    },
                    {
                        supplier: 'Hijab Accessories Supplier',
                        quantity: 200.0,
                        pricePerUnit: 4800,
                        purchaseDate: new Date('2024-02-15'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Magnetic Hijab Clips',
                    description: 'Modern magnetic clips for easy hijab styling',
                    code: generateMaterialCode(200, 'Magnetic Clips'),
                    unit: 'pcs',
                    qtyOnHand: 200.0,
                    minStock: 20.0,
                    maxStock: 400.0,
                    reorderPoint: 40.0,
                    reorderQty: 100.0,
                    location: 'Accessories Storage D2',
                    attributeType: 'Accessories',
                    attributeValue: 'Magnetic Clips'
                },
                purchases: [
                    {
                        supplier: 'Modern Hijab Solutions',
                        quantity: 200.0,
                        pricePerUnit: 12000,
                        purchaseDate: new Date('2024-02-05'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Hijab Caps/Ciput',
                    description: 'Inner caps for comfortable hijab wearing',
                    code: generateMaterialCode(100, 'Hijab Caps'),
                    unit: 'pcs',
                    qtyOnHand: 100.0,
                    minStock: 10.0,
                    maxStock: 200.0,
                    reorderPoint: 20.0,
                    reorderQty: 50.0,
                    location: 'Inner Wear Storage E1',
                    attributeType: 'Inner Wear',
                    attributeValue: 'Caps'
                },
                purchases: [
                    {
                        supplier: 'Hijab Essentials Co.',
                        quantity: 100.0,
                        pricePerUnit: 15000,
                        purchaseDate: new Date('2024-02-08'),
                        status: 'RECEIVED'
                    }
                ]
            },
            {
                material: {
                    name: 'Lace Trim',
                    description: 'Decorative lace trim for hijab edges',
                    code: generateMaterialCode(300, 'Lace Trim'),
                    unit: 'meter',
                    qtyOnHand: 300.0,
                    minStock: 30.0,
                    maxStock: 600.0,
                    reorderPoint: 60.0,
                    reorderQty: 150.0,
                    location: 'Trim Storage F1',
                    attributeType: 'Trim',
                    attributeValue: 'Lace'
                },
                purchases: [
                    {
                        supplier: 'Decorative Trims Ltd.',
                        quantity: 300.0,
                        pricePerUnit: 8000,
                        purchaseDate: new Date('2024-02-12'),
                        status: 'RECEIVED'
                    }
                ]
            }
        ]

        // Create materials and their purchase history
        for (const { material, purchases } of materialData) {
            const existingMaterial = await prisma.material.findFirst({
                where: { name: material.name }
            })

            let createdMaterial;
            if (!existingMaterial) {
                createdMaterial = await prisma.material.create({
                    data: material
                })
            } else {
                createdMaterial = existingMaterial;
            }

            // Create purchase logs for this material
            for (const purchase of purchases) {
                const existingPurchase = await prisma.purchaseLog.findFirst({
                    where: {
                        materialId: createdMaterial.id,
                        supplier: purchase.supplier,
                        purchaseDate: purchase.purchaseDate
                    }
                })

                if (!existingPurchase) {
                    await prisma.purchaseLog.create({
                        data: {
                            materialId: createdMaterial.id,
                            supplier: purchase.supplier,
                            quantity: purchase.quantity,
                            unit: material.unit,
                            pricePerUnit: purchase.pricePerUnit,
                            totalCost: purchase.quantity * purchase.pricePerUnit,
                            purchaseDate: purchase.purchaseDate,
                            status: purchase.status,
                            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            notes: `Sample purchase data for ${material.name}`
                        }
                    })

                    // Create corresponding material movement for received purchases
                    if (purchase.status === 'RECEIVED') {
                        await prisma.materialMovement.create({
                            data: {
                                materialId: createdMaterial.id,
                                userId: adminUser.id,
                                movementType: 'IN',
                                quantity: purchase.quantity,
                                unit: material.unit,
                                costPerUnit: purchase.pricePerUnit,
                                totalCost: purchase.quantity * purchase.pricePerUnit,
                                notes: `Stock in from purchase - ${purchase.supplier}`,
                                qtyAfter: createdMaterial.qtyOnHand,
                                movementDate: purchase.purchaseDate
                            }
                        })
                    }
                }
            }
        }

        console.log('✓ Hijab materials and purchase history created')

        // Create hijab products
        const chiffonFabric = await prisma.material.findFirst({ where: { name: 'Chiffon Fabric' } })
        const voileFabric = await prisma.material.findFirst({ where: { name: 'Voile Fabric' } })
        const cottonJersey = await prisma.material.findFirst({ where: { name: 'Cotton Jersey' } })
        const silkSatin = await prisma.material.findFirst({ where: { name: 'Silk Satin' } })

        const products = [
            {
                name: 'Premium Chiffon Hijab',
                code: 'HIJ-CHF-001',
                materialId: chiffonFabric?.id,
                category: 'Premium Hijabs',
                price: 125000,
                unit: 'pcs',
                description: 'Elegant chiffon hijab perfect for formal occasions',
                defaultTarget: 50
            },
            {
                name: 'Daily Voile Hijab',
                code: 'HIJ-VOI-001',
                materialId: voileFabric?.id,
                category: 'Daily Hijabs',
                price: 85000,
                unit: 'pcs',
                description: 'Comfortable voile hijab for everyday wear',
                defaultTarget: 100
            },
            {
                name: 'Cotton Inner Hijab',
                code: 'HIJ-CTN-001',
                materialId: cottonJersey?.id,
                category: 'Inner Hijabs',
                price: 45000,
                unit: 'pcs',
                description: 'Soft cotton inner hijab for comfort',
                defaultTarget: 75
            },
            {
                name: 'Luxury Silk Hijab',
                code: 'HIJ-SLK-001',
                materialId: silkSatin?.id,
                category: 'Luxury Hijabs',
                price: 250000,
                unit: 'pcs',
                description: 'Premium silk hijab for special occasions',
                defaultTarget: 25
            },
            {
                name: 'Square Chiffon Hijab',
                code: 'HIJ-SQR-001',
                materialId: chiffonFabric?.id,
                category: 'Square Hijabs',
                price: 95000,
                unit: 'pcs',
                description: 'Versatile square chiffon hijab',
                defaultTarget: 60
            },
            {
                name: 'Instant Voile Hijab',
                code: 'HIJ-INS-001',
                materialId: voileFabric?.id,
                category: 'Instant Hijabs',
                price: 75000,
                unit: 'pcs',
                description: 'Easy-to-wear instant hijab',
                defaultTarget: 80
            }
        ]

        for (const product of products) {
            await prisma.product.upsert({
                where: { code: product.code },
                update: {},
                create: product
            })
        }

        console.log('✓ Hijab products created')

        // Create hijab-specific colors
        const productColors = [
            // Basic hijab colors
            { colorName: 'Black', colorCode: 'BLCK' },
            { colorName: 'White', colorCode: 'WHT' },
            { colorName: 'Broken White', colorCode: 'BW' },
            { colorName: 'Cream', colorCode: 'CRM' },
            { colorName: 'Beige', colorCode: 'BEIG' },
            { colorName: 'Nude', colorCode: 'NUDE' },
            { colorName: 'Dusty Pink', colorCode: 'DPNK' },
            { colorName: 'Baby Pink', colorCode: 'BPNK' },
            { colorName: 'Soft Pink', colorCode: 'SPNK' },
            { colorName: 'Rose Gold', colorCode: 'RGLD' },
            { colorName: 'Navy Blue', colorCode: 'NAVY' },
            { colorName: 'Royal Blue', colorCode: 'RBLU' },
            { colorName: 'Sky Blue', colorCode: 'SBLU' },
            { colorName: 'Powder Blue', colorCode: 'PBLU' },
            { colorName: 'Sage Green', colorCode: 'SGRN' },
            { colorName: 'Olive Green', colorCode: 'OLIV' },
            { colorName: 'Forest Green', colorCode: 'FGRN' },
            { colorName: 'Mint Green', colorCode: 'MINT' },
            { colorName: 'Lavender', colorCode: 'LAVD' },
            { colorName: 'Purple', colorCode: 'PRPL' },
            { colorName: 'Plum', colorCode: 'PLUM' },
            { colorName: 'Burgundy', colorCode: 'BGDY' },
            { colorName: 'Maroon', colorCode: 'MARN' },
            { colorName: 'Wine Red', colorCode: 'WINE' },
            { colorName: 'Coral', colorCode: 'CORL' },
            { colorName: 'Peach', colorCode: 'PECH' },
            { colorName: 'Mustard', colorCode: 'MSTD' },
            { colorName: 'Camel', colorCode: 'CAML' },
            { colorName: 'Taupe', colorCode: 'TAUP' },
            { colorName: 'Grey', colorCode: 'GREY' },
            { colorName: 'Light Grey', colorCode: 'LGRY' },
            { colorName: 'Charcoal', colorCode: 'CHAR' },
            { colorName: 'Mocha', colorCode: 'MOCH' },
            { colorName: 'Chocolate', colorCode: 'CHOC' }
        ];

        // Create hijab-specific variations (sizes and styles)
        const productVariations = [
            // Hijab sizes
            { variationType: 'Size', variationValue: '110x110 cm' },
            { variationType: 'Size', variationValue: '120x120 cm' },
            { variationType: 'Size', variationValue: '130x130 cm' },
            { variationType: 'Size', variationValue: '140x140 cm' },
            { variationType: 'Size', variationValue: '150x150 cm' },
            { variationType: 'Size', variationValue: '160x160 cm' },
            { variationType: 'Size', variationValue: '170x170 cm' },
            { variationType: 'Size', variationValue: '180x180 cm' },
            { variationType: 'Size', variationValue: '200x200 cm' },

            // Rectangle sizes
            { variationType: 'Size', variationValue: '70x180 cm' },
            { variationType: 'Size', variationValue: '75x200 cm' },
            { variationType: 'Size', variationValue: '80x200 cm' },

            // Hijab styles
            { variationType: 'Style', variationValue: 'Plain' },
            { variationType: 'Style', variationValue: 'Printed' },
            { variationType: 'Style', variationValue: 'Embroidered' },
            { variationType: 'Style', variationValue: 'Lace Edge' },
            { variationType: 'Style', variationValue: 'Sequined' },
            { variationType: 'Style', variationValue: 'Pleated' },
            { variationType: 'Style', variationValue: 'Textured' },
            { variationType: 'Style', variationValue: 'Ombre' },
            { variationType: 'Style', variationValue: 'Two-Tone' },

            // Hijab types
            { variationType: 'Type', variationValue: 'Square' },
            { variationType: 'Type', variationValue: 'Rectangle' },
            { variationType: 'Type', variationValue: 'Instant' },
            { variationType: 'Type', variationValue: 'Shawl' },
            { variationType: 'Type', variationValue: 'Pashmina' },
            { variationType: 'Type', variationValue: 'Khimar' },
            { variationType: 'Type', variationValue: 'Bergo' }
        ];

        // Create standalone colors and variations
        for (const color of productColors) {
            const existingColor = await prisma.productColour.findFirst({
                where: {
                    colorName: color.colorName,
                    colorCode: color.colorCode
                }
            });

            if (!existingColor) {
                await prisma.productColour.create({
                    data: {
                        colorName: color.colorName,
                        colorCode: color.colorCode,
                        isActive: true
                    }
                });
            }
        }

        for (const variation of productVariations) {
            const existingVariation = await prisma.productVariation.findFirst({
                where: {
                    variationType: variation.variationType,
                    variationValue: variation.variationValue
                }
            });

            if (!existingVariation) {
                await prisma.productVariation.create({
                    data: {
                        variationType: variation.variationType,
                        variationValue: variation.variationValue,
                        priceAdjustment: Math.random() > 0.8 ? (Math.random() * 25000) : null, // 20% chance of price adjustment
                        isActive: true
                    }
                });
            }
        }

        // Update existing products to reference colors and variations
        const existingProducts = await prisma.product.findMany({
            where: { isActive: true }
        });

        const allColors = await prisma.productColour.findMany();
        const allVariations = await prisma.productVariation.findMany();

        for (const product of existingProducts) {
            // Assign random color and variation to existing products
            const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
            const randomVariation = allVariations[Math.floor(Math.random() * allVariations.length)];

            await prisma.product.update({
                where: { id: product.id },
                data: {
                    productColorId: randomColor.id,
                    productVariationId: randomVariation.id
                }
            });
        }

        console.log('✓ Hijab colors and variations created')

        // Create hijab-related contacts
        const contacts = [
            {
                name: 'Siti Aminah',
                phone: '+628123456789',
                whatsappPhone: '+628123456789',
                email: 'siti.aminah@hijabstore.com',
                contactType: 'WORKER',
                company: 'Hijab Production Team',
                notes: 'Experienced hijab seamstress and quality control'
            },
            {
                name: 'Premium Textile Indonesia',
                phone: '+62215551234',
                email: 'orders@premiumtextile.co.id',
                contactType: 'SUPPLIER',
                company: 'Premium Textile Indonesia',
                address: 'Jl. Industri Tekstil No. 123, Bandung, Jawa Barat'
            },
            {
                name: 'Hijab Fabric Supplier',
                phone: '+62215551235',
                email: 'sales@hijabfabric.co.id',
                contactType: 'SUPPLIER',
                company: 'Hijab Fabric Supplier',
                address: 'Jl. Kain Hijab No. 45, Solo, Jawa Tengah'
            },
            {
                name: 'Luxury Silk Imports',
                phone: '+62215551236',
                email: 'info@luxurysilk.co.id',
                contactType: 'SUPPLIER',
                company: 'Luxury Silk Imports',
                address: 'Jl. Sutra Mewah No. 78, Jakarta Pusat'
            },
            {
                name: 'Hijab Boutique Jakarta',
                phone: '+62215551237',
                email: 'order@hijabboutique.com',
                contactType: 'CUSTOMER',
                company: 'Hijab Boutique Jakarta',
                address: 'Jl. Fashion No. 90, Jakarta Selatan'
            },
            {
                name: 'Muslimah Fashion Store',
                phone: '+62215551238',
                email: 'procurement@muslimahfashion.com',
                contactType: 'CUSTOMER',
                company: 'Muslimah Fashion Store',
                address: 'Jl. Busana Muslim No. 12, Surabaya, Jawa Timur'
            },
            {
                name: 'Fatimah Zahra',
                phone: '+628123456790',
                whatsappPhone: '+628123456790',
                email: 'fatimah.zahra@hijabstore.com',
                contactType: 'WORKER',
                company: 'Hijab Design Team',
                notes: 'Creative designer specializing in modern hijab styles'
            },
            {
                name: 'Hijab Accessories Supplier',
                phone: '+62215551239',
                email: 'sales@hijabaccessories.co.id',
                contactType: 'SUPPLIER',
                company: 'Hijab Accessories Supplier',
                address: 'Jl. Aksesoris Hijab No. 34, Yogyakarta'
            }
        ]

        for (const contact of contacts) {
            const existingContact = await prisma.contact.findFirst({
                where: { name: contact.name }
            })

            if (!existingContact) {
                await prisma.contact.create({
                    data: contact
                })
            }
        }

        console.log('✓ Hijab-related contacts created')

        // Create sample orders with different statuses for realistic business scenario
        const sampleOrders = [
            {
                orderNumber: 'ORD-000001',
                status: 'CREATED',
                targetPcs: 50,
                completedPcs: 0,
                customerNote: 'Premium chiffon hijabs for Ramadan collection - high quality required',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
                description: 'Special order for Ramadan collection with premium chiffon fabric',
                priority: 'HIGH',
                userId: adminUser.id,
                workerContactId: null
            },
            {
                orderNumber: 'ORD-000002',
                status: 'PROCESSING',
                targetPcs: 100,
                completedPcs: 60,
                customerNote: 'Daily voile hijabs - standard quality for regular customers',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                description: 'Regular production order for daily wear hijabs',
                priority: 'MEDIUM',
                userId: adminUser.id,
                workerContactId: null
            },
            {
                orderNumber: 'ORD-000003',
                status: 'COMPLETED',
                targetPcs: 30,
                completedPcs: 30,
                customerNote: 'Luxury silk hijabs for special event - premium finish required',
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                description: 'Completed luxury order for special event',
                priority: 'URGENT',
                userId: adminUser.id,
                workerContactId: null
            },
            {
                orderNumber: 'ORD-000004',
                status: 'CONFIRMED',
                targetPcs: 75,
                completedPcs: 0,
                customerNote: 'Mixed hijab styles for boutique - various colors needed',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
                description: 'Boutique order with mixed product types',
                priority: 'MEDIUM',
                userId: adminUser.id,
                workerContactId: null
            },
            {
                orderNumber: 'ORD-000005',
                status: 'NEED_MATERIAL',
                targetPcs: 40,
                completedPcs: 0,
                customerNote: 'Cotton inner hijabs - waiting for material delivery',
                dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                description: 'On hold - waiting for cotton material delivery',
                priority: 'LOW',
                userId: adminUser.id,
                workerContactId: null
            }
        ]

        const createdOrders = []
        for (const orderData of sampleOrders) {
            const existingOrder = await prisma.order.findFirst({
                where: { orderNumber: orderData.orderNumber }
            })

            if (!existingOrder) {
                const order = await prisma.order.create({
                    data: orderData
                })
                createdOrders.push(order)
            } else {
                createdOrders.push(existingOrder)
            }
        }

        console.log('✓ Sample orders created with different statuses')

        // Create order products linking existing products to orders
        const orderProductsData = [
            // Order 1 (ORD-000001) - Premium Ramadan collection
            { orderId: createdOrders[0].id, productId: 1, quantity: 25, unitPrice: 125000, notes: 'Premium chiffon - main collection' },
            { orderId: createdOrders[0].id, productId: 4, quantity: 25, unitPrice: 250000, notes: 'Luxury silk - special pieces' },
            
            // Order 2 (ORD-000002) - Daily hijabs (in progress)
            { orderId: createdOrders[1].id, productId: 2, quantity: 60, unitPrice: 85000, completedQty: 40, notes: 'Daily voile - regular production' },
            { orderId: createdOrders[1].id, productId: 3, quantity: 40, unitPrice: 45000, completedQty: 20, notes: 'Cotton inner - basic quality' },
            
            // Order 3 (ORD-000003) - Completed luxury order
            { orderId: createdOrders[2].id, productId: 4, quantity: 30, unitPrice: 250000, completedQty: 30, status: 'COMPLETED', notes: 'Luxury silk - completed successfully' },
            
            // Order 4 (ORD-000004) - Boutique mixed order
            { orderId: createdOrders[3].id, productId: 1, quantity: 25, unitPrice: 125000, notes: 'Premium chiffon for boutique' },
            { orderId: createdOrders[3].id, productId: 2, quantity: 25, unitPrice: 85000, notes: 'Daily voile for boutique' },
            { orderId: createdOrders[3].id, productId: 5, quantity: 25, unitPrice: 95000, notes: 'Square chiffon for boutique' },
            
            // Order 5 (ORD-000005) - Cotton order waiting for material
            { orderId: createdOrders[4].id, productId: 3, quantity: 40, unitPrice: 45000, notes: 'Cotton inner - waiting for material' }
        ]

        for (const opData of orderProductsData) {
            const existingOrderProduct = await prisma.orderProduct.findFirst({
                where: {
                    orderId: opData.orderId,
                    productId: opData.productId
                }
            })

            if (!existingOrderProduct) {
                const totalPrice = (opData.unitPrice || 0) * (opData.quantity || 1)
                await prisma.orderProduct.create({
                    data: {
                        ...opData,
                        totalPrice,
                        status: opData.status || 'PENDING'
                    }
                })
            }
        }

        console.log('✓ Order products created linking products to orders')

        // Create order tracking links
        const orderLinksData = [
            {
                orderId: createdOrders[0].id,
                userId: adminUser.id,
                linkToken: `track_${createdOrders[0].orderNumber}_${Date.now()}`,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            },
            {
                orderId: createdOrders[1].id,
                userId: adminUser.id,
                linkToken: `track_${createdOrders[1].orderNumber}_${Date.now() + 1}`,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                orderId: createdOrders[2].id,
                userId: adminUser.id,
                linkToken: `track_${createdOrders[2].orderNumber}_${Date.now() + 2}`,
                isActive: false, // Disabled since order is completed
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        ]

        for (const linkData of orderLinksData) {
            const existingLink = await prisma.orderLink.findFirst({
                where: { orderId: linkData.orderId }
            })

            if (!existingLink) {
                await prisma.orderLink.create({
                    data: linkData
                })
            }
        }

        console.log('✓ Order tracking links created')

        // Create progress reports for orders
        const progressReportsData = [
            // Progress for Order 2 (processing order)
            {
                orderId: createdOrders[1].id,
                userId: adminUser.id,
                reportText: 'Started production - completed 30 pieces of daily voile hijabs. Quality is good, on schedule.',
                percentage: 30,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            },
            {
                orderId: createdOrders[1].id,
                userId: adminUser.id,
                reportText: 'Good progress - completed additional 30 pieces (total 60/100). Started cotton inner hijabs.',
                percentage: 60,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            },
            // Progress for completed Order 3
            {
                orderId: createdOrders[2].id,
                userId: adminUser.id,
                reportText: 'Started luxury silk hijab production - 15 pieces completed with premium finish.',
                percentage: 50,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            },
            {
                orderId: createdOrders[2].id,
                userId: adminUser.id,
                reportText: 'Completed all 30 luxury silk hijabs. Quality inspection passed. Ready for delivery.',
                percentage: 100,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            }
        ]

        for (const reportData of progressReportsData) {
            const existingReport = await prisma.progressReport.findFirst({
                where: {
                    orderId: reportData.orderId,
                    reportText: reportData.reportText
                }
            })

            if (!existingReport) {
                await prisma.progressReport.create({
                    data: reportData
                })
            }
        }

        console.log('✓ Progress reports created for order tracking')

        // Create contact notes for business communications
        const contactNotesData = [
            {
                contactId: 1, // Siti Aminah (worker)
                orderId: createdOrders[1].id,
                createdBy: adminUser.id,
                noteType: 'GENERAL',
                subject: 'Progress Update Meeting',
                content: 'Met with Siti to discuss Order ORD-000002 progress. She confirmed 60 pieces completed and expects to finish remaining 40 pieces by next week. Quality is excellent.',
                isImportant: false,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                contactId: 2, // Premium Textile Indonesia (supplier)
                createdBy: adminUser.id,
                noteType: 'PURCHASE',
                subject: 'Bulk Fabric Order Discussion',
                content: 'Negotiated pricing for next month chiffon fabric order. Secured 5% bulk discount for orders above 200 meters. Delivery scheduled for next Friday.',
                isImportant: true,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                contactId: 5, // Hijab Boutique Jakarta (customer)
                orderId: createdOrders[3].id,
                createdBy: adminUser.id,
                noteType: 'ORDER',
                subject: 'Special Requirements Discussion',
                content: 'Customer requested specific color combinations for boutique order. Confirmed: 10 pieces in dusty pink, 10 in sage green, 5 in navy blue for each product type.',
                isImportant: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                contactId: 7, // Fatimah Zahra (designer)
                createdBy: adminUser.id,
                noteType: 'GENERAL',
                subject: 'New Design Ideas',
                content: 'Fatimah presented new embroidered edge designs for premium collection. Samples look promising for next season launch.',
                isImportant: false,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ]

        for (const noteData of contactNotesData) {
            const existingNote = await prisma.contactNote.findFirst({
                where: {
                    contactId: noteData.contactId,
                    subject: noteData.subject
                }
            })

            if (!existingNote) {
                await prisma.contactNote.create({
                    data: noteData
                })
            }
        }

        console.log('✓ Contact notes created for business communications')

        // Create product photos for catalog
        const productPhotosData = [
            // Premium Chiffon Hijab photos
            {
                productId: 1,
                photoPath: '/uploads/products/premium-chiffon-main.jpg',
                thumbnailPath: '/uploads/products/thumbnails/premium-chiffon-main_thumb.jpg',
                description: 'Premium Chiffon Hijab - Main Product View',
                isPrimary: true,
                sortOrder: 0,
                fileSize: 2048576, // 2MB
                mimeType: 'image/jpeg'
            },
            {
                productId: 1,
                photoPath: '/uploads/products/premium-chiffon-detail.jpg',
                thumbnailPath: '/uploads/products/thumbnails/premium-chiffon-detail_thumb.jpg',
                description: 'Premium Chiffon Hijab - Fabric Detail',
                isPrimary: false,
                sortOrder: 1,
                fileSize: 1536576, // 1.5MB
                mimeType: 'image/jpeg'
            },
            // Daily Voile Hijab photos
            {
                productId: 2,
                photoPath: '/uploads/products/daily-voile-main.jpg',
                thumbnailPath: '/uploads/products/thumbnails/daily-voile-main_thumb.jpg',
                description: 'Daily Voile Hijab - Main Product View',
                isPrimary: true,
                sortOrder: 0,
                fileSize: 1892576, // 1.8MB
                mimeType: 'image/jpeg'
            },
            // Cotton Inner Hijab photos
            {
                productId: 3,
                photoPath: '/uploads/products/cotton-inner-main.jpg',
                thumbnailPath: '/uploads/products/thumbnails/cotton-inner-main_thumb.jpg',
                description: 'Cotton Inner Hijab - Comfort View',
                isPrimary: true,
                sortOrder: 0,
                fileSize: 1345576, // 1.3MB
                mimeType: 'image/jpeg'
            },
            // Luxury Silk Hijab photos
            {
                productId: 4,
                photoPath: '/uploads/products/luxury-silk-main.jpg',
                thumbnailPath: '/uploads/products/thumbnails/luxury-silk-main_thumb.jpg',
                description: 'Luxury Silk Hijab - Premium View',
                isPrimary: true,
                sortOrder: 0,
                fileSize: 2456576, // 2.4MB
                mimeType: 'image/jpeg'
            },
            {
                productId: 4,
                photoPath: '/uploads/products/luxury-silk-texture.jpg',
                thumbnailPath: '/uploads/products/thumbnails/luxury-silk-texture_thumb.jpg',
                description: 'Luxury Silk Hijab - Texture Close-up',
                isPrimary: false,
                sortOrder: 1,
                fileSize: 1987576, // 1.9MB
                mimeType: 'image/jpeg'
            }
        ]

        for (const photoData of productPhotosData) {
            const existingPhoto = await prisma.productPhoto.findFirst({
                where: {
                    productId: photoData.productId,
                    photoPath: photoData.photoPath
                }
            })

            if (!existingPhoto) {
                await prisma.productPhoto.create({
                    data: photoData
                })
            }
        }

        console.log('✓ Product photos added to catalog')

        // Create remaining materials for waste tracking
        const remainingMaterialsData = [
            {
                materialId: chiffonFabric?.id,
                quantity: 2.5,
                unit: 'meter',
                notes: 'Leftover from Order ORD-000003 - high quality remnants, perfect for samples or small accessories'
            },
            {
                materialId: voileFabric?.id,
                quantity: 1.8,
                unit: 'meter',
                notes: 'Small pieces from cutting process - suitable for inner hijab patches or product samples'
            },
            {
                materialId: cottonJersey?.id,
                quantity: 3.2,
                unit: 'meter',
                notes: 'Good quality leftover cotton - can be used for next cotton inner hijab order'
            },
            {
                materialId: silkSatin?.id,
                quantity: 0.7,
                unit: 'meter',
                notes: 'Premium silk remnant - save for luxury accessories or special custom orders'
            }
        ]

        for (const materialData of remainingMaterialsData) {
            if (materialData.materialId) {
                const existingMaterial = await prisma.remainingMaterial.findFirst({
                    where: {
                        materialId: materialData.materialId,
                        notes: materialData.notes
                    }
                })

                if (!existingMaterial) {
                    await prisma.remainingMaterial.create({
                        data: materialData
                    })
                }
            }
        }

        console.log('✓ Remaining materials added for waste tracking')

        console.log('')
        console.log('🎉 COMPREHENSIVE HIJAB WMS DATABASE SEEDING COMPLETED! 🎉')
        console.log('')
        console.log('📊 Business Data Summary:')
        console.log('   • 5 Sample orders with different statuses (CREATED, PROCESSING, COMPLETED, etc.)')
        console.log('   • 9 Order-product relationships with realistic quantities')
        console.log('   • 3 Order tracking links for customer access')
        console.log('   • 4 Progress reports showing production tracking')
        console.log('   • 4 Contact notes for business communications')
        console.log('   • 6 Product photos for catalog display')
        console.log('   • 4 Remaining material records for waste tracking')
        console.log('')
        console.log('🚀 Your dashboard should now show populated data for all models!')
        console.log('💼 Ready for full WMS demonstration and testing!')

    } catch (error) {
        console.error('Error during seeding:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 