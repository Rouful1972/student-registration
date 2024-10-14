const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Student = require('../models/studentModel');

// Register a new student
exports.registerStudent = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const studentExists = await Student.findOne({ email });

        if (studentExists) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = new Student({
            name,
            email,
            password: hashedPassword,
        });

        await newStudent.save();

        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login a student
exports.loginStudent = async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.cookie('token', token, { httpOnly: true });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get student profile
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).select('-password');
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update student profile
exports.updateProfile = async (req, res) => {
    const { name } = req.body;

    try {
        const student = await Student.findById(req.student.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        student.name = name || student.name;

        if (req.file) {
            student.profilePic = req.file.path;
        }

        await student.save();
        res.json({ message: 'Profile updated', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const fs = require('fs');
const path = require('path');

// Upload file
exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({ message: 'File uploaded successfully', file: req.file.path });
};

// Read file
exports.readFile = (req, res) => {
    const filePath = path.join(__dirname, '../uploads/', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
};

// Delete file
exports.deleteFile = (req, res) => {
    const filePath = path.join(__dirname, '../uploads/', req.params.filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'File deleted successfully' });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
};
