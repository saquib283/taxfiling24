import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'testimonials.json');

function getReviews() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

function saveReviews(reviews: any[]) {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(reviews, null, 2), 'utf8');
}

export async function GET() {
  try {
    const reviews = getReviews();
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, content, rating } = body;

    const reviews = getReviews();
    const newReview = {
      id: String(Date.now()),
      name,
      role: role || "",
      content,
      rating: Number(rating) || 5,
      isApproved: true, // Defaulting to true so they appear on homepage for now
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    saveReviews(reviews);

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const reviews = getReviews();
    const filtered = reviews.filter((r: any) => r.id !== id);
    saveReviews(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isApproved } = body;
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const reviews = getReviews();
    const updated = reviews.map((r: any) => 
      r.id === id ? { ...r, isApproved: isApproved !== undefined ? isApproved : !r.isApproved } : r
    );
    saveReviews(updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
