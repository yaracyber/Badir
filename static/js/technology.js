/**
 * Badir - Technology Page JavaScript
 * 
 * This file contains functionality specific to the technology page
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Technology page initialized');
    
    // Initialize animations for tech stack icons
    const techIcons = document.querySelectorAll('.tech-icon');
    
    // Animate icons on scroll
    if (techIcons.length > 0) {
        // Set up intersection observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add animation class when element is visible
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                    // Stop observing after animation is triggered
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2  // Trigger when 20% of the element is visible
        });
        
        // Observe each tech icon
        techIcons.forEach(icon => {
            observer.observe(icon);
        });
    }
    
    // Blockchain steps animation
    const blockchainSteps = document.querySelectorAll('.blockchain-steps li');
    
    if (blockchainSteps.length > 0) {
        // Set up intersection observer for blockchain steps
        const stepsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add a slight delay based on index for staggered animation
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }, index * 200);
                    
                    // Stop observing after animation is triggered
                    stepsObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        // Set initial styles and observe each step
        blockchainSteps.forEach((step, index) => {
            // Set initial state for animation
            step.style.opacity = '0';
            step.style.transform = 'translateX(-20px)';
            step.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            // Observe element
            stepsObserver.observe(step);
        });
    }
    
    // YouTube video lazy loading
    const videoContainer = document.querySelector('.ratio-16x9');
    if (videoContainer) {
        // Create intersection observer for video
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Get iframe
                    const iframe = entry.target.querySelector('iframe');
                    
                    // If iframe src is not yet loaded
                    if (iframe && iframe.src.includes('about:blank')) {
                        // Replace with actual YouTube URL
                        iframe.src = 'https://www.youtube.com/embed/SSo_EIwHSd4';
                    }
                    
                    // Stop observing
                    videoObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        // Start observing
        videoObserver.observe(videoContainer);
    }
    
    // Open external links in new tab
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.getAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    // Add smooth scroll behavior to technology page sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});
