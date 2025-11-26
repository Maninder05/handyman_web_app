// controllers/findJobController.js

const Job = require("../models/Job"); // Adjust path based on your project

/**
 * @desc    Get all jobs with optional filters
 * @route   GET /api/jobs
 * @access  Public
 */
exports.getAllJobs = async (req, res) => {
    try {
        const { title, location, category, minSalary, maxSalary } = req.query;

        let filter = {};

        if (title) filter.title = { $regex: title, $options: "i" };
        if (location) filter.location = { $regex: location, $options: "i" };
        if (category) filter.category = category;

        if (minSalary || maxSalary) {
            filter.salary = {};
            if (minSalary) filter.salary.$gte = Number(minSalary);
            if (maxSalary) filter.salary.$lte = Number(maxSalary);
        }

        const jobs = await Job.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, results: jobs.length, jobs });

    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Get single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        res.status(200).json({ success: true, job });

    } catch (error) {
        console.error("Error fetching job by ID:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Filter jobs by category (shortcut route)
 * @route   GET /api/jobs/category/:category
 * @access  Public
 */
exports.getJobsByCategory = async (req, res) => {
    try {
        const jobs = await Job.find({ category: req.params.category });

        res.status(200).json({ success: true, results: jobs.length, jobs });

    } catch (error) {
        console.error("Error fetching category jobs:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Advanced job search (title + location + salary + type)
 * @route   POST /api/jobs/search
 * @access  Public
 */
exports.searchJobs = async (req, res) => {
    try {
        const { keyword, location, jobType, salaryRange } = req.body;

        let filter = {};

        if (keyword) filter.title = { $regex: keyword, $options: "i" };
        if (location) filter.location = { $regex: location, $options: "i" };
        if (jobType) filter.jobType = jobType;

        if (salaryRange) {
            filter.salary = {};
            if (salaryRange.min) filter.salary.$gte = salaryRange.min;
            if (salaryRange.max) filter.salary.$lte = salaryRange.max;
        }

        const jobs = await Job.find(filter);

        res.status(200).json({ success: true, results: jobs.length, jobs });

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
